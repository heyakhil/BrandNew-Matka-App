import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { ObjectId } from "./db.ts";
import { ZodError, z } from "zod";
import {
  MatkaRulesError,
  DEFAULT_RATE_CARD,
  DEFAULT_STAKE_LIMITS,
  buildFullResult,
  buildOpenResult,
} from "../../packages/matka-rules/src/index.ts";
import {
  checkPassword,
  currentUser,
  hashPassword,
  issueToken,
  authMiddleware,
} from "./auth.ts";
import { client, connectDatabase } from "./db.ts";
import { finishPasswordReset, startPasswordReset, verifyPasswordReset } from "./passwordReset.ts";
import { pruneExpiredAuthRecords, startRegistration, verifyRegistration } from "./registration.ts";
import {
  ApiError,
  adjustWallet,
  bettingPhase,
  cancelMarketDay,
  declareResult,
  marketDate,
  placeBets,
  reverseResult,
} from "./game.ts";
import {
  betRequestSchema,
  credentialsSchema,
  dateSchema,
  objectIdSchema,
  playerLoginSchema,
  playerRegisterSchema,
  registrationVerifySchema,
  passwordResetStartSchema,
  passwordResetVerifySchema,
  passwordResetFinishSchema,
} from "./validation.ts";

const app = express();
const adminOrigin = process.env.ADMIN_ORIGIN ?? "http://localhost:5173";
app.disable("x-powered-by");
app.use(cors({ origin: adminOrigin, credentials: true }));
app.use(express.json({ limit: "64kb" }));
app.use((request: Request, response: Response, next: NextFunction) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.headers.cookie?.includes("admin_token=")
  ) {
    if (request.headers.origin !== adminOrigin) {
      response.status(403).json({ error: "Invalid request origin." });
      return;
    }
  }
  next();
});

const loginAttempts = new Map<string, { count: number; until: number }>();
function limitLogin(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  if (loginAttempts.size > 10_000) {
    for (const [address, attempt] of loginAttempts)
      if (attempt.until <= Date.now()) loginAttempts.delete(address);
  }
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.until > now && attempt.count >= 10) {
    response.status(429).json({ error: "Too many login attempts. Try later." });
    return;
  }
  loginAttempts.set(
    key,
    attempt && attempt.until > now
      ? { ...attempt, count: attempt.count + 1 }
      : { count: 1, until: now + 15 * 60_000 }
  );
  next();
}

const data = await connectDatabase();
const playerAuth = authMiddleware(
  (id) => data.users.findOne({ _id: id }),
  "player"
);
const adminAuth = authMiddleware(
  (id) => data.users.findOne({ _id: id }),
  "admin"
);

app.get("/api/health", (_request, response) => response.json({ ok: true }));

app.post("/api/auth/register/start", limitLogin, async (request, response) => {
  try {
    const input = playerRegisterSchema.parse(request.body);
    const challengeId = await startRegistration(input);
    response.status(202).json({ challengeId });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/auth/register/verify", limitLogin, async (request, response) => {
  try {
    const { challengeId, otp } = registrationVerifySchema.parse(request.body);
    const session = await verifyRegistration(challengeId, otp);
    response.status(201).json({
      token: session.token,
      user: { id: session.user._id, name: session.user.name, phone: session.user.phone, balancePaise: 0 },
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/auth/password-reset/start", limitLogin, async (request, response) => {
  try {
    const { phone } = passwordResetStartSchema.parse(request.body);
    const challengeId = await startPasswordReset(phone);
    response.status(202).json({ challengeId });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/auth/password-reset/verify", limitLogin, async (request, response) => {
  try {
    const { challengeId, otp } = passwordResetVerifySchema.parse(request.body);
    response.json({ resetToken: await verifyPasswordReset(challengeId, otp) });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/auth/password-reset/finish", limitLogin, async (request, response) => {
  try {
    const { challengeId, resetToken, password } = passwordResetFinishSchema.parse(request.body);
    await finishPasswordReset(challengeId, resetToken, password);
    response.status(204).end();
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/auth/login", limitLogin, async (request, response) => {
  try {
    const { phone, password } = playerLoginSchema.parse(request.body);
    const user = await data.users.findOne({ phone, role: "player" });
    if (
      !user ||
      user.disabled ||
      !(await checkPassword(password, user.passwordHash))
    )
      throw new ApiError(401, "Invalid credentials.");
    response.json({
      token: await issueToken(user),
      user: {
        id: user._id,
        name: user.name ?? "",
        phone,
        balancePaise: user.balancePaise,
      },
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/login", limitLogin, async (request, response) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const user = await data.users.findOne({ email, role: "admin" });
    if (
      !user ||
      user.disabled ||
      !(await checkPassword(password, user.passwordHash))
    )
      throw new ApiError(401, "Invalid credentials.");
    response.cookie("admin_token", await issueToken(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api",
      maxAge: 12 * 60 * 60 * 1000,
    });
    response.json({ email: user.email });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/logout", (_request, response) => {
  response.clearCookie("admin_token", { path: "/api" });
  response.status(204).end();
});

app.get("/api/markets", async (_request, response) => {
  try {
    const markets = await data.markets
      .find({ active: true })
      .sort({ openTime: 1 })
      .toArray();
    const today = new Date();
    const rows = await Promise.all(
      markets.map(async (market) => {
        const date = marketDate(today, market);
        const day = await data.days.findOne({ marketId: market._id, date });
        const recent = await data.days
          .find({
            marketId: market._id,
            date: { $lt: date },
            closePanna: { $exists: true },
          })
          .sort({ date: -1 })
          .limit(10)
          .toArray();
        const line =
          day?.closePanna && day.openPanna
            ? buildFullResult(day.openPanna, day.closePanna).line
            : day?.openPanna
            ? buildOpenResult(day.openPanna).line
            : "***-**-***";
        return {
          id: market._id,
          name: market.name,
          openTime: market.openTime,
          closeTime: market.closeTime,
          openBidLastTime: cutoffTime(market.openTime, market.cutoffMinutes),
          closeBidLastTime: cutoffTime(market.closeTime, market.cutoffMinutes),
          date,
          line,
          phase: bettingPhase(today, market, day),
          rateCard: market.rateCard,
          limits: market.limits,
          recentChart: recent
            .filter((row) => row.openPanna && row.closePanna)
            .map((row) => ({
              date: row.date,
              result: buildFullResult(row.openPanna ?? "", row.closePanna ?? "")
                .line,
            })),
        };
      })
    );
    response.json(rows);
  } catch (error) {
    handleError(error, response);
  }
});

function cutoffTime(time: string, cutoffMinutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute - cutoffMinutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}

app.get("/api/me", playerAuth, (_request, response) => {
  const user = currentUser(response);
  response.json({
    id: user._id,
    email: user.email,
    name: user.name ?? "",
    phone: user.phone ?? "",
    dob: user.dob ?? "",
    referralCode: user.referralCode ?? "",
    balancePaise: user.balancePaise,
  });
});

app.patch("/api/me", playerAuth, async (request, response) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().regex(/^\d{10}$/),
      })
      .parse(request.body);
    await data.users.updateOne(
      { _id: currentUser(response)._id },
      { $set: input }
    );
    response.json({ ...input, email: currentUser(response).email });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/me/password", playerAuth, async (request, response) => {
  try {
    const input = z
      .object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(128),
      })
      .parse(request.body);
    const user = currentUser(response);
    if (!(await checkPassword(input.currentPassword, user.passwordHash)))
      throw new ApiError(401, "Current password is incorrect.");
    const passwordHash = await hashPassword(input.newPassword);
    const updated = await data.users.findOneAndUpdate(
      { _id: user._id },
      { $set: { passwordHash }, $inc: { passwordVersion: 1 } },
      { returnDocument: "after" }
    );
    if (!updated) throw new ApiError(404, "User not found.");
    response.json({ token: await issueToken(updated) });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/bets", playerAuth, async (request, response) => {
  try {
    const body = z
      .object({ marketId: objectIdSchema, request: betRequestSchema })
      .parse(request.body);
    const [bet] = await placeBets(
      data,
      currentUser(response),
      new ObjectId(body.marketId),
      [body.request]
    );
    response.status(201).json(bet);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/bets/batch", playerAuth, async (request, response) => {
  try {
    const body = z
      .object({
        marketId: objectIdSchema,
        requestId: z.string().min(12).max(100),
        requests: z.array(betRequestSchema).min(1).max(50),
      })
      .parse(request.body);
    response
      .status(201)
      .json(
        await placeBets(
          data,
          currentUser(response),
          new ObjectId(body.marketId),
          body.requests,
          body.requestId
        )
      );
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/me/bets", playerAuth, async (_request, response) => {
  try {
    const bets = await data.bets
      .find({ userId: currentUser(response)._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    response.json(bets);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/me/passbook", playerAuth, async (_request, response) => {
  try {
    const entries = await data.entries
      .find({ userId: currentUser(response)._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    response.json(entries);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/session", adminAuth, (_request, response) =>
  response.json({ email: currentUser(response).email })
);

app.get("/api/admin/dashboard", adminAuth, async (_request, response) => {
  try {
    const [users, markets, bets, results] = await Promise.all([
      data.users.countDocuments({ role: "player" }),
      data.markets.countDocuments(),
      data.bets.countDocuments(),
      data.days.countDocuments({
        $or: [
          { openPanna: { $exists: true } },
          { closePanna: { $exists: true } },
        ],
      }),
    ]);
    response.json({ users, markets, bets, results });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/users", adminAuth, async (request, response) => {
  try {
    const page = Math.max(1, Math.min(100000, Number(request.query.page) || 1));
    const users = await data.users
      .find({ role: "player" }, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * 25)
      .limit(25)
      .toArray();
    response.json(users);
  } catch (error) {
    handleError(error, response);
  }
});

app.patch("/api/admin/users/:id", adminAuth, async (request, response) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const { disabled } = z
      .object({ disabled: z.boolean() })
      .parse(request.body);
    const user = await data.users.findOneAndUpdate(
      { _id: new ObjectId(id), role: "player" },
      { $set: { disabled } },
      { returnDocument: "after", projection: { passwordHash: 0 } }
    );
    if (!user) throw new ApiError(404, "User not found.");
    response.json(user);
  } catch (error) {
    handleError(error, response);
  }
});

app.post(
  "/api/admin/users/:id/wallet",
  adminAuth,
  async (request, response) => {
    try {
      const id = objectIdSchema.parse(request.params.id);
      const input = z
        .object({
          amountPaise: z.number().int().safe(),
          referenceId: z.string().min(6).max(100),
        })
        .parse(request.body);
      await adjustWallet(
        data,
        new ObjectId(id),
        input.amountPaise,
        input.referenceId
      );
      response.status(204).end();
    } catch (error) {
      handleError(error, response);
    }
  }
);

app.get("/api/admin/markets", adminAuth, async (_request, response) => {
  try {
    response.json(await data.markets.find().sort({ openTime: 1 }).toArray());
  } catch (error) {
    handleError(error, response);
  }
});

const rate = z.object({
  numerator: z.number().int().positive().safe(),
  denominator: z.number().int().positive().safe(),
});
const marketSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,50}$/),
  name: z.string().min(2).max(80),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().default("Asia/Kolkata"),
  cutoffMinutes: z.number().int().min(0).max(120).default(10),
  active: z.boolean().default(true),
  rateCard: z
    .object({
      single: rate,
      jodi: rate,
      sp: rate,
      dp: rate,
      tp: rate,
      halfSangam: rate,
      fullSangam: rate,
    })
    .default(DEFAULT_RATE_CARD),
  limits: z
    .object({
      minPaise: z.number().int().positive().safe(),
      maxPaise: z.number().int().positive().safe(),
    })
    .default(DEFAULT_STAKE_LIMITS),
});

app.post("/api/admin/markets", adminAuth, async (request, response) => {
  try {
    const input = marketSchema.parse(request.body);
    new Intl.DateTimeFormat("en", { timeZone: input.timezone });
    if (input.limits.minPaise > input.limits.maxPaise)
      throw new ApiError(400, "Invalid stake limits.");
    const market = { _id: new ObjectId(), ...input };
    await data.markets.insertOne(market);
    response.status(201).json(market);
  } catch (error) {
    handleError(error, response);
  }
});

app.patch("/api/admin/markets/:id", adminAuth, async (request, response) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const input = marketSchema.partial().parse(request.body);
    if (input.timezone)
      new Intl.DateTimeFormat("en", { timeZone: input.timezone });
    if (input.limits && input.limits.minPaise > input.limits.maxPaise)
      throw new ApiError(400, "Invalid stake limits.");
    const marketId = new ObjectId(id);
    const current = await data.markets.findOne({ _id: marketId });
    if (!current) throw new ApiError(404, "Market not found.");
    if (input.active === false)
      await cancelMarketDay(data, marketId, marketDate(new Date(), current));
    const market = await data.markets.findOneAndUpdate(
      { _id: marketId },
      { $set: input },
      { returnDocument: "after" }
    );
    if (!market) throw new ApiError(404, "Market not found.");
    response.json(market);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/results/declare", adminAuth, async (request, response) => {
  try {
    const input = z
      .object({
        marketId: objectIdSchema,
        date: dateSchema,
        side: z.enum(["open", "close"]),
        panna: z.string().regex(/^\d{3}$/),
      })
      .parse(request.body);
    response.json(
      await declareResult(
        data,
        new ObjectId(input.marketId),
        input.date,
        input.side,
        input.panna
      )
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/results/reverse", adminAuth, async (request, response) => {
  try {
    const input = z
      .object({
        marketId: objectIdSchema,
        date: dateSchema,
        side: z.enum(["open", "close"]),
      })
      .parse(request.body);
    response.json({
      debitedPaise: await reverseResult(
        data,
        new ObjectId(input.marketId),
        input.date,
        input.side
      ),
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/results/cancel", adminAuth, async (request, response) => {
  try {
    const input = z
      .object({ marketId: objectIdSchema, date: dateSchema })
      .parse(request.body);
    response.json({
      refundedPaise: await cancelMarketDay(
        data,
        new ObjectId(input.marketId),
        input.date
      ),
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/results/history", adminAuth, async (request, response) => {
  try {
    const page = Math.max(1, Math.min(100000, Number(request.query.page) || 1));
    const days = await data.days
      .find()
      .sort({ date: -1 })
      .skip((page - 1) * 25)
      .limit(25)
      .toArray();
    response.json(
      days.map((day) => ({
        ...day,
        line:
          day.closePanna && day.openPanna
            ? buildFullResult(day.openPanna, day.closePanna).line
            : day.openPanna
            ? buildOpenResult(day.openPanna).line
            : "—",
      }))
    );
  } catch (error) {
    handleError(error, response);
  }
});

function handleError(error: unknown, response: Response): void {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof MatkaRulesError) {
    response.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    response
      .status(400)
      .json({ error: error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  if (
    error instanceof Error &&
    "code" in error &&
    [11000, 1062, "ER_DUP_ENTRY"].includes(
      (error as Error & { code?: number | string }).code ?? 0
    )
  ) {
    response.status(409).json({ error: "Record already exists." });
    return;
  }
  console.error(error);
  response.status(500).json({ error: "Server error." });
}

const port = Number(process.env.PORT ?? 4000);
const cleanupTimer = setInterval(async () => {
  try {
    await pruneExpiredAuthRecords();
  } catch (error) {
    console.error("Auth record cleanup failed:", error);
  }
}, 60 * 60_000);
cleanupTimer.unref();
export const server = app.listen(port, () =>
  console.log(`API listening on ${port}`)
);
process.on("SIGTERM", async () => {
  try {
    clearInterval(cleanupTimer);
    server.close();
    await client.close();
  } catch (error) {
    console.error(error);
  }
});
