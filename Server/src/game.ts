import { ObjectId, type ClientSession } from "./db.ts";
import {
  acceptBet,
  buildFullResult,
  buildOpenResult,
  declareClose,
  declareOpen,
  normalizePanna,
  settleSlip,
  settlesOnOpen,
  type BetRequest,
  type BettingPhase,
  type MarketResult,
} from "../../packages/matka-rules/src/index.ts";
import {
  client,
  collections,
  type Bet,
  type Market,
  type MarketDay,
  type StoredSlip,
  type User,
  type WalletEntry,
} from "./db.ts";

type Data = ReturnType<typeof collections>;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function localParts(
  now: Date,
  timezone: string
): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function minutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function marketDate(now: Date, market: Market): string {
  const local = localParts(now, market.timezone);
  const open = minutes(market.openTime);
  const close = minutes(market.closeTime);
  if (close <= open && local.minutes < close) {
    const previous = new Date(`${local.date}T00:00:00.000Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    return previous.toISOString().slice(0, 10);
  }
  return local.date;
}

export function bettingPhase(
  now: Date,
  market: Market,
  day: MarketDay | null
): BettingPhase {
  if (!market.active || day?.cancelled) return "cancelled";
  if (day?.closePanna) return "closed";
  const local = localParts(now, market.timezone);
  const open = minutes(market.openTime);
  const close = minutes(market.closeTime);
  const isOvernight = close <= open;
  const sessionDate = marketDate(now, market);
  const elapsed =
    sessionDate === local.date ? local.minutes : local.minutes + 1440;
  const openCutoff = open - market.cutoffMinutes;
  const closeCutoff = close + (isOvernight ? 1440 : 0) - market.cutoffMinutes;
  if (elapsed >= closeCutoff) return "closed";
  return elapsed >= openCutoff || day?.openPanna
    ? "afterOpenCutoff"
    : "preOpen";
}

function safeSum(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total))
    throw new ApiError(400, "Amount exceeds the safe calculation limit.");
  return total;
}

async function moveWallet(
  data: Data,
  session: ClientSession,
  userId: ObjectId,
  amountPaise: number,
  kind: WalletEntry["kind"],
  referenceId: string
): Promise<void> {
  if (!Number.isSafeInteger(amountPaise))
    throw new ApiError(400, "Invalid wallet amount.");
  const user = await data.users.findOne({ _id: userId }, { session });
  if (!user) throw new ApiError(404, "User not found.");
  if (
    amountPaise < 0 &&
    kind !== "reversal" &&
    user.balancePaise < -amountPaise
  )
    throw new ApiError(409, "Insufficient balance.");
  const nextBalance = user.balancePaise + amountPaise;
  if (!Number.isSafeInteger(nextBalance))
    throw new ApiError(
      400,
      "Wallet balance exceeds the safe calculation limit."
    );
  const updated = await data.users.updateOne(
    { _id: userId, balancePaise: user.balancePaise },
    { $set: { balancePaise: nextBalance } },
    { session }
  );
  if (updated.modifiedCount !== 1)
    throw new ApiError(409, "Wallet changed; retry the request.");
  await data.entries.insertOne(
    {
      _id: new ObjectId(),
      userId,
      amountPaise,
      balanceAfterPaise: nextBalance,
      kind,
      referenceId,
      createdAt: new Date(),
    },
    { session }
  );
}

export async function placeBets(
  data: Data,
  user: User,
  marketId: ObjectId,
  requests: readonly BetRequest[],
  requestId?: string
): Promise<Bet[]> {
  try {
    if (requests.length === 0 || requests.length > 50)
      throw new ApiError(400, "Submit between 1 and 50 entries.");
    const signature = JSON.stringify({
      marketId: marketId.toHexString(),
      requests,
    });
    const existing = requestId
      ? await data.batches.findOne({ userId: user._id, requestId })
      : null;
    if (existing) {
      if (existing.signature !== signature)
        throw new ApiError(
          409,
          "Request ID was already used for different bets."
        );
      const oldBets = await data.bets
        .find({ _id: { $in: existing.betIds } })
        .toArray();
      return existing.betIds
        .map((id) => oldBets.find((bet) => bet._id.equals(id)))
        .filter((bet): bet is Bet => bet !== undefined);
    }
    const market = await data.markets.findOne({ _id: marketId });
    if (!market) throw new ApiError(404, "Market not found.");
    const date = marketDate(new Date(), market);
    let placed: Bet[] | undefined;
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const day = await data.days.findOneAndUpdate(
          { marketId, date },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              marketId,
              date,
              cancelled: false,
            },
            $inc: { revision: 1 },
          },
          { upsert: true, returnDocument: "after", session }
        );
        if (!day) throw new ApiError(500, "Could not open market day.");
        const phase = bettingPhase(new Date(), market, day);
        placed = requests.map((request) => {
          const accepted = acceptBet(
            phase,
            request,
            market.rateCard,
            market.limits
          );
          return {
            _id: new ObjectId(),
            userId: user._id,
            marketId,
            date,
            request,
            slips: accepted.slips.map((priced) => ({
              ...priced,
              status: "pending" as const,
              winningPaise: 0,
            })),
            totalStakePaise: accepted.totalStakePaise,
            createdAt: new Date(),
          };
        });
        const totalStake = safeSum(placed.map((bet) => bet.totalStakePaise));
        const batchId = new ObjectId();
        await moveWallet(
          data,
          session,
          user._id,
          -totalStake,
          "bet",
          batchId.toHexString()
        );
        await data.bets.insertMany(placed, { session });
        if (requestId)
          await data.batches.insertOne(
            {
              _id: batchId,
              userId: user._id,
              requestId,
              signature,
              betIds: placed.map((bet) => bet._id),
              createdAt: new Date(),
            },
            { session }
          );
      });
    });
    if (!placed) throw new ApiError(500, "Bets were not placed.");
    return placed;
  } catch (error) {
    if (
      requestId &&
      error instanceof Error &&
      "code" in error &&
      [11000, 1062, "ER_DUP_ENTRY"].includes(
        (error as Error & { code?: number | string }).code ?? 0
      )
    ) {
      const existing = await data.batches.findOne({
        userId: user._id,
        requestId,
      });
      if (existing) {
        const signature = JSON.stringify({
          marketId: marketId.toHexString(),
          requests,
        });
        if (existing.signature !== signature)
          throw new ApiError(
            409,
            "Request ID was already used for different bets."
          );
        const oldBets = await data.bets
          .find({ _id: { $in: existing.betIds } })
          .toArray();
        return existing.betIds
          .map((id) => oldBets.find((bet) => bet._id.equals(id)))
          .filter((bet): bet is Bet => bet !== undefined);
      }
    }
    throw error;
  }
}

export async function declareResult(
  data: Data,
  marketId: ObjectId,
  date: string,
  side: "open" | "close",
  panna: string
): Promise<{ line: string; creditedPaise: number; noop: boolean }> {
  try {
    let result:
      | { line: string; creditedPaise: number; noop: boolean }
      | undefined;
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const day = await data.days.findOneAndUpdate(
          { marketId, date },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              marketId,
              date,
              cancelled: false,
            },
            $inc: { revision: 1 },
          },
          { upsert: true, returnDocument: "after", session }
        );
        if (!day || day.cancelled)
          throw new ApiError(409, "Market day is cancelled.");
        const canonical = normalizePanna(panna);
        const existing = side === "open" ? day.openPanna : day.closePanna;
        if (existing === canonical) {
          const line =
            side === "open"
              ? buildOpenResult(canonical).line
              : buildFullResult(day.openPanna ?? "", canonical).line;
          result = { line, creditedPaise: 0, noop: true };
          return;
        }
        if (existing)
          throw new ApiError(
            409,
            "Result already declared. Reverse it before correcting."
          );
        if (side === "close" && !day.openPanna)
          throw new ApiError(409, "Declare the open panna first.");
        const bets = await data.bets
          .find({ marketId, date }, { session })
          .toArray();
        const priced = bets.flatMap((bet) =>
          bet.slips.filter((slip) => slip.status === "pending")
        );
        const batch =
          side === "open"
            ? declareOpen(canonical, priced)
            : declareClose(day.openPanna ?? "", canonical, priced);
        const creditByUser = new Map<string, number>();
        for (const bet of bets) {
          const updated: StoredSlip[] = bet.slips.map((pricedSlip) => {
            if (
              pricedSlip.status !== "pending" ||
              (side === "open") !== settlesOnOpen(pricedSlip.slip)
            )
              return pricedSlip;
            const outcome = settleSlip(
              batch.result as MarketResult,
              pricedSlip
            );
            if (outcome.winningPaise > 0) {
              const id = bet.userId.toHexString();
              creditByUser.set(
                id,
                safeSum([creditByUser.get(id) ?? 0, outcome.winningPaise])
              );
            }
            return {
              ...pricedSlip,
              status: outcome.status,
              winningPaise: outcome.winningPaise,
            };
          });
          await data.bets.updateOne(
            { _id: bet._id },
            { $set: { slips: updated } },
            { session }
          );
        }
        if (safeSum([...creditByUser.values()]) !== batch.creditPaise) {
          throw new ApiError(
            500,
            "Settlement total does not match wallet credits."
          );
        }
        const referenceId = `${marketId}:${date}:${side}:${day.revision}`;
        for (const [id, amount] of creditByUser) {
          await moveWallet(
            data,
            session,
            new ObjectId(id),
            amount,
            "win",
            referenceId
          );
        }
        await data.days.updateOne(
          { _id: day._id },
          {
            $set:
              side === "open"
                ? {
                    openPanna: canonical,
                    openDeclaredAt: new Date(),
                    openRevision: day.revision,
                  }
                : {
                    closePanna: canonical,
                    closeDeclaredAt: new Date(),
                    closeRevision: day.revision,
                  },
          },
          { session }
        );
        result = {
          line: batch.result?.line ?? "",
          creditedPaise: batch.creditPaise,
          noop: false,
        };
      });
    });
    if (!result) throw new ApiError(500, "Result declaration failed.");
    return result;
  } catch (error) {
    throw error;
  }
}

export async function reverseResult(
  data: Data,
  marketId: ObjectId,
  date: string,
  side: "open" | "close"
): Promise<number> {
  try {
    let debitedPaise = 0;
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const day = await data.days.findOneAndUpdate(
          { marketId, date },
          { $inc: { revision: 1 } },
          { returnDocument: "after", session }
        );
        if (!day) throw new ApiError(404, "Market day not found.");
        if (side === "open" && day.closePanna)
          throw new ApiError(409, "Reverse the close result first.");
        const declared = side === "open" ? day.openPanna : day.closePanna;
        const declarationRevision =
          side === "open" ? day.openRevision : day.closeRevision;
        if (!declared || declarationRevision === undefined)
          throw new ApiError(409, "Result is not declared.");
        const bets = await data.bets
          .find({ marketId, date }, { session })
          .toArray();
        const debitByUser = new Map<string, number>();
        for (const bet of bets) {
          const updated = bet.slips.map((slip) => {
            if ((side === "open") !== settlesOnOpen(slip.slip)) return slip;
            if (slip.winningPaise > 0) {
              const id = bet.userId.toHexString();
              debitByUser.set(
                id,
                safeSum([debitByUser.get(id) ?? 0, slip.winningPaise])
              );
            }
            return { ...slip, status: "pending" as const, winningPaise: 0 };
          });
          await data.bets.updateOne(
            { _id: bet._id },
            { $set: { slips: updated } },
            { session }
          );
        }
        const referenceId = `${marketId}:${date}:${side}:${declarationRevision}`;
        for (const [id, amount] of debitByUser) {
          await moveWallet(
            data,
            session,
            new ObjectId(id),
            -amount,
            "reversal",
            referenceId
          );
          debitedPaise = safeSum([debitedPaise, amount]);
        }
        await data.days.updateOne(
          { _id: day._id },
          {
            $unset:
              side === "open"
                ? { openPanna: "", openDeclaredAt: "", openRevision: "" }
                : { closePanna: "", closeDeclaredAt: "", closeRevision: "" },
          },
          { session }
        );
      });
    });
    return debitedPaise;
  } catch (error) {
    throw error;
  }
}

export async function cancelMarketDay(
  data: Data,
  marketId: ObjectId,
  date: string
): Promise<number> {
  try {
    let refundedPaise = 0;
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const day = await data.days.findOneAndUpdate(
          { marketId, date },
          {
            $setOnInsert: { _id: new ObjectId(), marketId, date },
            $set: { cancelled: true },
            $inc: { revision: 1 },
          },
          { upsert: true, returnDocument: "after", session }
        );
        if (!day) throw new ApiError(500, "Could not cancel market day.");
        const bets = await data.bets
          .find({ marketId, date }, { session })
          .toArray();
        const refunds = new Map<string, number>();
        for (const bet of bets) {
          const updated = bet.slips.map((slip) => {
            if (slip.status !== "pending") return slip;
            const id = bet.userId.toHexString();
            refunds.set(id, safeSum([refunds.get(id) ?? 0, slip.stakePaise]));
            return { ...slip, status: "refunded" as const };
          });
          await data.bets.updateOne(
            { _id: bet._id },
            { $set: { slips: updated } },
            { session }
          );
        }
        for (const [id, amount] of refunds) {
          await moveWallet(
            data,
            session,
            new ObjectId(id),
            amount,
            "refund",
            `${marketId}:${date}`
          );
          refundedPaise = safeSum([refundedPaise, amount]);
        }
      });
    });
    return refundedPaise;
  } catch (error) {
    throw error;
  }
}

export async function adjustWallet(
  data: Data,
  userId: ObjectId,
  amountPaise: number,
  referenceId: string
): Promise<void> {
  try {
    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise === 0 ||
      Math.abs(amountPaise) > 100_000_000
    ) {
      throw new ApiError(400, "Invalid adjustment amount.");
    }
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const user = await data.users.findOne(
          { _id: userId, role: "player", disabled: false },
          { session }
        );
        if (!user) throw new ApiError(404, "Active player not found.");
        await moveWallet(
          data,
          session,
          userId,
          amountPaise,
          "adjustment",
          referenceId
        );
      });
    });
  } catch (error) {
    throw error;
  }
}
