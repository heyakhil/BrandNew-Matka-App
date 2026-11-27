import "dotenv/config";
import { timingSafeEqual } from "node:crypto";
import express, {
  type Request,
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import type { RowDataPacket } from "mysql2/promise";
import {
  ADMIN_PERMISSIONS,
  ObjectId,
  type AdminPermission,
} from "./db.ts";
import { ZodError, z } from "zod";
import {
  MatkaRulesError,
  DEFAULT_RATE_CARD,
  DEFAULT_STAKE_LIMITS,
  buildFullResult,
  buildOpenResult,
} from "./matka-rules/index.ts";
import {
  checkPassword,
  currentUser,
  hashPassword,
  issueToken,
  authMiddleware,
} from "./auth.ts";
import { client, connectDatabase, sqlPool } from "./db.ts";
import { finishPasswordReset, startPasswordReset, verifyPasswordReset } from "./passwordReset.ts";
import { pruneExpiredAuthRecords, startRegistration, verifyRegistration } from "./registration.ts";
import {
  ApiError,
  acceptWithdrawalRequest,
  adjustWallet,
  bettingPhase,
  cancelMarketDay,
  createWithdrawalRequest,
  declareResult,
  marketDate,
  placeBets,
  rejectWithdrawalRequest,
  reverseResult,
} from "./game.ts";
import {
  isFirebaseConfigured,
  registerFcmToken,
  removeFcmToken,
  sendTopicPushNotification,
  sendUserPushNotification,
} from "./notification.ts";
import {
  createPay0Payment,
  reconcilePay0Payment,
  reconcileUserPayment,
  verifyPay0WebhookSignature,
} from "./payments.ts";
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
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
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
function requireAdminPermission(permission: AdminPermission): RequestHandler {
  return requireAnyAdminPermission([permission]);
}

function requireAnyAdminPermission(
  required: readonly AdminPermission[]
): RequestHandler {
  return (_request, response, next): void => {
    const permissions = currentUser(response).adminPermissions;
    if (
      permissions === undefined ||
      permissions === null ||
      required.some((permission) => permissions.includes(permission))
    ) {
      next();
      return;
    }
    response.status(403).json({ error: "You do not have access to this action." });
  };
}

function indiaDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

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
          jodiChartUrl: market.jodiChartUrl ?? "",
          pannaChartUrl: market.pannaChartUrl ?? "",
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
    bankDetails: user.bankDetails ?? null,
  });
});

app.patch("/api/me/bank-details", playerAuth, async (request, response) => {
  try {
    const input = z
      .object({
        accountHolder: z.string().trim().max(120).optional(),
        bankName: z.string().trim().max(120).optional(),
        accountNumber: z.string().trim().max(40).optional(),
        ifscCode: z.string().trim().max(20).optional(),
        upiId: z.string().trim().max(120).optional(),
      })
      .parse(request.body);
    const user = currentUser(response);
    const merged = {
      accountHolder: input.accountHolder ?? user.bankDetails?.accountHolder ?? "",
      bankName: input.bankName ?? user.bankDetails?.bankName ?? "",
      accountNumber: input.accountNumber ?? user.bankDetails?.accountNumber ?? "",
      ifscCode: (input.ifscCode ?? user.bankDetails?.ifscCode ?? "").toUpperCase(),
      upiId: input.upiId ?? user.bankDetails?.upiId ?? "",
    };
    await data.users.updateOne(
      { _id: user._id },
      { $set: { bankDetails: merged } }
    );
    response.json(merged);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/me/withdrawals", playerAuth, async (_request, response) => {
  try {
    const rows = await data.withdrawalRequests
      .find({ userId: currentUser(response)._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    response.json(rows);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/me/withdrawals", playerAuth, async (request, response) => {
  try {
    const { amountRupees, method } = z
      .object({
        amountRupees: z.number().int().positive().max(10_000_000),
        method: z.enum(["bank", "upi"]),
      })
      .parse(request.body);
    const created = await createWithdrawalRequest(
      data,
      currentUser(response)._id,
      amountRupees * 100,
      method
    );
    response.status(201).json(created);
  } catch (error) {
    handleError(error, response);
  }
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

app.post("/api/me/fcm-token", playerAuth, async (request, response) => {
  try {
    const user = currentUser(response);
    const input = z
      .object({
        token: z.string().trim().min(10).max(512),
        platform: z.enum(["android", "ios"]).default("android"),
      })
      .parse(request.body);
    await registerFcmToken(data, user._id, input.token, input.platform);
    response.status(204).end();
  } catch (error) {
    handleError(error, response);
  }
});

app.delete("/api/me/fcm-token", playerAuth, async (request, response) => {
  try {
    const input = z
      .object({
        token: z.string().trim().min(10).max(512),
      })
      .parse(request.body);
    await removeFcmToken(data, input.token);
    response.status(204).end();
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

app.post("/api/me/payments/pay0", playerAuth, async (request, response) => {
  try {
    const { amountRupees } = z
      .object({ amountRupees: z.number().int().positive().max(1_000_000) })
      .parse(request.body);
    const payment = await createPay0Payment(
      data,
      currentUser(response),
      amountRupees * 100
    );
    response.status(201).json(payment);
  } catch (error) {
    handleError(error, response);
  }
});

app.get(
  "/api/me/payments/pay0/:orderId",
  playerAuth,
  async (request, response) => {
    try {
      const orderId = z.string().min(12).max(64).parse(request.params.orderId);
      response.json(
        await reconcileUserPayment(
          data,
          currentUser(response)._id,
          orderId
        )
      );
    } catch (error) {
      handleError(error, response);
    }
  }
);

app.post("/api/payments/pay0/webhook", async (request, response) => {
  const parsed = z
    .object({
      order_id: z
        .string()
        .min(12)
        .max(64)
        .regex(/^[A-Za-z0-9_-]+$/),
      status: z.string().min(1).max(32),
      hash: z.string().regex(/^[\da-f]{64}$/i),
    })
    .safeParse(request.body);
  if (!parsed.success) {
    response.status(400).send("Invalid webhook.");
    return;
  }
  try {
    if (
      !verifyPay0WebhookSignature(parsed.data.order_id, parsed.data.hash)
    ) {
      response.status(403).send("Invalid signature.");
      return;
    }
    const payment = await reconcilePay0Payment(data, parsed.data.order_id);
    if (
      parsed.data.status.toUpperCase() === "SUCCESS" &&
      payment.status !== "paid"
    ) {
      response.status(503).send("Payment status is still being reconciled.");
      return;
    }
    response.status(200).send("OK");
  } catch (error) {
    console.error("Pay0 webhook reconciliation failed:", error);
    response.status(error instanceof ApiError ? error.status : 503).send(
      error instanceof ApiError && error.status < 500
        ? error.message
        : "Verification failed."
    );
  }
});

app.get("/api/payments/pay0/redirect", async (request, response) => {
  try {
    const orderId = z
      .string()
      .min(12)
      .max(64)
      .regex(/^[A-Za-z0-9_-]+$/)
      .parse(request.query.order_id);
    const payment = await reconcilePay0Payment(data, orderId);
    const scheme = (process.env.MOBILE_DEEP_LINK_SCHEME ?? "royalclubmatka")
      .trim();
    if (!/^[a-z][a-z0-9+.-]*$/i.test(scheme))
      throw new ApiError(503, "Mobile redirect is not configured.");
    response.redirect(
      `${scheme}://payment/result?order_id=${encodeURIComponent(orderId)}&status=${payment.status}`
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/session", adminAuth, (_request, response) => {
  const user = currentUser(response);
  response.json({
    email: user.email,
    name: user.name ?? "",
    permissions: user.adminPermissions ?? [...ADMIN_PERMISSIONS],
  });
});

app.get("/api/admin/dashboard", adminAuth, async (_request, response) => {
  try {
    const [[financialRows], users, markets, bets, results] = await Promise.all([
      sqlPool.execute<RowDataPacket[]>(
        `SELECT
          COALESCE((SELECT SUM(total_stake_paise) FROM bets WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))), 0) AS today_bid_paise,
            COALESCE((SELECT SUM(amount_paise) FROM wallet_entries WHERE kind = 'adjustment' AND amount_paise > 0 AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))), 0) AS today_deposit_paise,
            COALESCE((SELECT -SUM(amount_paise) FROM wallet_entries WHERE kind = 'adjustment' AND amount_paise < 0 AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))), 0) AS today_withdrawal_paise,
          COALESCE((SELECT SUM(balance_paise) FROM users WHERE role = 'player'), 0) AS wallet_balance_paise`
      ),
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
    const financials = financialRows[0] as RowDataPacket | undefined;
    response.json({
      users,
      markets,
      bets,
      results,
      todayBidPaise: Number(financials?.today_bid_paise ?? 0),
      todayDepositPaise: Number(financials?.today_deposit_paise ?? 0),
      todayWithdrawalPaise: Number(financials?.today_withdrawal_paise ?? 0),
      walletBalancePaise: Number(financials?.wallet_balance_paise ?? 0),
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/users", adminAuth, requireAdminPermission("users"), async (request, response) => {
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

app.patch("/api/admin/users/:id", adminAuth, requireAdminPermission("users"), async (request, response) => {
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
  requireAdminPermission("transactions"),
  async (request, response) => {
    try {
      const id = objectIdSchema.parse(request.params.id);
      const input = z
        .object({
          amountPaise: z.number().int().safe(),
          referenceId: z.string().min(6).max(100),
        })
        .parse(request.body);
      const targetUserId = new ObjectId(id);
      await adjustWallet(
        data,
        targetUserId,
        input.amountPaise,
        input.referenceId
      );
      const formattedAmount = (Math.abs(input.amountPaise) / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      if (input.amountPaise > 0) {
        await sendUserPushNotification(
          data,
          targetUserId,
          "Wallet Recharged 💰",
          `₹${formattedAmount} has been credited to your wallet. Ref: ${input.referenceId}`,
          {
            type: "wallet_recharge",
            amountPaise: String(input.amountPaise),
            referenceId: input.referenceId,
          }
        );
      } else if (input.amountPaise < 0) {
        await sendUserPushNotification(
          data,
          targetUserId,
          "Wallet Withdrawal 💸",
          `₹${formattedAmount} has been debited from your wallet. Ref: ${input.referenceId}`,
          {
            type: "wallet_withdraw",
            amountPaise: String(input.amountPaise),
            referenceId: input.referenceId,
          }
        );
      }
      response.status(204).end();
    } catch (error) {
      handleError(error, response);
    }
  }
);

app.get("/api/admin/markets", adminAuth, requireAnyAdminPermission(["markets", "results"]), async (_request, response) => {
  try {
    response.json(await data.markets.find().sort({ openTime: 1 }).toArray());
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/users/:id/report", adminAuth, requireAdminPermission("users"), async (request, response) => {
  try {
    const userId = new ObjectId(objectIdSchema.parse(request.params.id));
    const user = await data.users.findOne({ _id: userId, role: "player" }, { projection: { passwordHash: 0 } });
    if (!user) throw new ApiError(404, "User not found.");
    const [rows] = await sqlPool.execute<RowDataPacket[]>(
      `SELECT
        COALESCE((SELECT SUM(total_stake_paise) FROM bets WHERE user_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))), 0) AS today_bid_paise,
        COALESCE((SELECT SUM(amount_paise) FROM wallet_entries WHERE user_id = ? AND kind = 'adjustment' AND amount_paise > 0), 0) AS deposits_paise,
        COALESCE((SELECT -SUM(amount_paise) FROM wallet_entries WHERE user_id = ? AND kind = 'adjustment' AND amount_paise < 0), 0) AS withdrawals_paise`,
      [userId.toHexString(), userId.toHexString(), userId.toHexString()]
    );
    response.json({
      user,
      todayBidPaise: Number(rows[0]?.today_bid_paise ?? 0),
      depositsPaise: Number(rows[0]?.deposits_paise ?? 0),
      withdrawalsPaise: Number(rows[0]?.withdrawals_paise ?? 0),
    });
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
  jodiChartUrl: z.string().max(500).optional(),
  pannaChartUrl: z.string().max(500).optional(),
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

app.post("/api/admin/markets", adminAuth, requireAdminPermission("markets"), async (request, response) => {
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

app.patch("/api/admin/markets/:id", adminAuth, requireAdminPermission("markets"), async (request, response) => {
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

app.post("/api/admin/results/declare", adminAuth, requireAdminPermission("results"), async (request, response) => {
  try {
    const input = z
      .object({
        marketId: objectIdSchema,
        date: dateSchema,
        side: z.enum(["open", "close"]),
        panna: z.string().regex(/^\d{3}$/),
      })
      .parse(request.body);
    const marketObjectId = new ObjectId(input.marketId);
    const result = await declareResult(
      data,
      marketObjectId,
      input.date,
      input.side,
      input.panna
    );
    const market = await data.markets.findOne({ _id: marketObjectId });
    const marketName = market?.name ?? "Market";
    const sideLabel = input.side === "open" ? "Open" : "Close";
    const digit = (Number(input.panna[0]) + Number(input.panna[1]) + Number(input.panna[2])) % 10;
    const notificationTitle = `${marketName} Result Declared! 🎯`;
    const notificationBody = `${sideLabel}: ${input.panna}-${digit} (${input.date})`;
    await Promise.all([
      sendTopicPushNotification("results", notificationTitle, notificationBody, {
        type: "result_declared",
        marketId: input.marketId,
        side: input.side,
        panna: input.panna,
        digit: String(digit),
        date: input.date,
      }),
      sendTopicPushNotification("all", notificationTitle, notificationBody, {
        type: "result_declared",
        marketId: input.marketId,
        side: input.side,
        panna: input.panna,
        digit: String(digit),
        date: input.date,
      }),
    ]);
    response.json(result);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/results/reverse", adminAuth, requireAdminPermission("results"), async (request, response) => {
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

app.post("/api/admin/results/cancel", adminAuth, requireAdminPermission("results"), async (request, response) => {
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

app.get("/api/admin/results/history", adminAuth, requireAdminPermission("results"), async (request, response) => {
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

app.get("/api/admin/reports/markets", adminAuth, requireAdminPermission("reports"), async (request, response) => {
  try {
    const date = request.query.date
      ? dateSchema.parse(request.query.date)
      : indiaDate();
    const markets = await data.markets.find().sort({ openTime: 1 }).toArray();
    const bets = await data.bets.find({ date }).toArray();
    response.json(
      markets.map((market) => {
        const rows = bets.filter((bet) => bet.marketId.equals(market._id));
        const bidPaise = rows.reduce((sum, bet) => sum + bet.totalStakePaise, 0);
        const winningPaise = rows.reduce(
          (sum, bet) => sum + bet.slips.reduce((total, slip) => total + (slip.winningPaise ?? 0), 0),
          0
        );
        return {
          marketId: market._id,
          marketName: market.name,
          bidPaise,
          winningPaise,
          profitPaise: bidPaise - winningPaise,
          winners: new Set(
            rows
              .filter((bet) => bet.slips.some((slip) => slip.winningPaise > 0))
              .map((bet) => bet.userId.toHexString())
          ).size,
        };
      })
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/reports/winners", adminAuth, requireAdminPermission("reports"), async (request, response) => {
  try {
    const date = request.query.date
      ? dateSchema.parse(request.query.date)
      : indiaDate();
    const bets = await data.bets
      .find({ date })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();
    const winningBets = bets.filter((bet) =>
      bet.slips.some((slip) => slip.winningPaise > 0)
    );
    const userIds = [...new Set(winningBets.map((bet) => bet.userId.toHexString()))];
    const marketIds = [...new Set(winningBets.map((bet) => bet.marketId.toHexString()))];
    const [users, markets] = await Promise.all([
      data.users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray(),
      data.markets.find({ _id: { $in: marketIds.map((id) => new ObjectId(id)) } }).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [user._id.toHexString(), user]));
    const marketsById = new Map(markets.map((market) => [market._id.toHexString(), market]));
    response.json(
      winningBets.map((bet) => ({
        _id: bet._id,
        userId: bet.userId,
        userName: usersById.get(bet.userId.toHexString())?.name ?? "Player",
        userPhone: usersById.get(bet.userId.toHexString())?.phone ?? "",
        marketName: marketsById.get(bet.marketId.toHexString())?.name ?? "Market",
        date: bet.date,
        winningPaise: bet.slips.reduce((sum, slip) => sum + slip.winningPaise, 0),
        createdAt: bet.createdAt,
      }))
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/withdrawals", adminAuth, requireAdminPermission("transactions"), async (_request, response) => {
  try {
    const [rows] = await sqlPool.execute<RowDataPacket[]>(
      `SELECT w.id, w.user_id, w.amount_paise, w.method, w.payment_details, w.status, w.admin_note, w.reviewed_at, w.created_at,
              COALESCE(u.name, u.phone, u.email) AS user_name, u.phone AS user_phone, u.email AS user_email, u.balance_paise AS user_balance_paise
       FROM withdrawal_requests w
       INNER JOIN users u ON u.id = w.user_id
       ORDER BY CASE WHEN w.status = 'pending' THEN 0 WHEN w.status = 'approved' THEN 1 ELSE 2 END, w.created_at DESC
       LIMIT 200`
    );
    response.json(
      rows.map((row) => ({
        _id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userPhone: row.user_phone ?? "",
        userEmail: row.user_email ?? "",
        userBalancePaise: Number(row.user_balance_paise ?? 0),
        amountPaise: Number(row.amount_paise),
        method: row.method as "bank" | "upi",
        paymentDetails:
          typeof row.payment_details === "string"
            ? JSON.parse(row.payment_details)
            : row.payment_details ?? {},
        status: row.status as "pending" | "approved" | "rejected",
        adminNote: row.admin_note ?? "",
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
      }))
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/withdrawals/:id/accept", adminAuth, requireAdminPermission("transactions"), async (request, response) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(request.params.id));
    const body = z.object({ note: z.string().trim().max(255).optional() }).safeParse(request.body ?? {});
    const note = body.success ? body.data.note : undefined;
    const updated = await acceptWithdrawalRequest(
      data,
      id,
      currentUser(response)._id,
      note
    );
    const formattedAmount = (updated.amountPaise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    await sendUserPushNotification(
      data,
      updated.userId,
      "Withdrawal Approved 💸",
      `Your withdrawal request of ₹${formattedAmount} has been approved.`,
      {
        type: "withdrawal_approved",
        amountPaise: String(updated.amountPaise),
        requestId: updated._id.toHexString(),
      }
    );
    response.json(updated);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/withdrawals/:id/reject", adminAuth, requireAdminPermission("transactions"), async (request, response) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(request.params.id));
    const body = z.object({ note: z.string().trim().max(255).optional() }).safeParse(request.body ?? {});
    const note = body.success ? body.data.note : undefined;
    const updated = await rejectWithdrawalRequest(
      data,
      id,
      currentUser(response)._id,
      note
    );
    const formattedAmount = (updated.amountPaise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    await sendUserPushNotification(
      data,
      updated.userId,
      "Withdrawal Rejected",
      `Your withdrawal request of ₹${formattedAmount} was rejected${note ? `: ${note}` : "."}`,
      {
        type: "withdrawal_rejected",
        amountPaise: String(updated.amountPaise),
        requestId: updated._id.toHexString(),
      }
    );
    response.json(updated);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/transactions", adminAuth, requireAdminPermission("transactions"), async (request, response) => {
  try {
    const type = z.enum(["all", "deposit", "withdrawal"]).default("all").parse(request.query.type);
    const typeSql =
      type === "deposit"
        ? "AND e.kind = 'adjustment' AND e.amount_paise > 0"
        : type === "withdrawal"
        ? "AND e.kind = 'adjustment' AND e.amount_paise < 0"
        : "";
    const [rows] = await sqlPool.execute<RowDataPacket[]>(
      `SELECT e.id, e.user_id, COALESCE(u.name, u.phone, u.email) AS user_name, u.phone,
              e.amount_paise, e.balance_after_paise, e.kind, e.reference_id, e.created_at
       FROM wallet_entries e
       INNER JOIN users u ON u.id = e.user_id
       WHERE u.role = 'player' ${typeSql}
       ORDER BY e.created_at DESC
       LIMIT 500`
    );
    response.json(
      rows.map((row) => ({
        _id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        phone: row.phone,
        amountPaise: Number(row.amount_paise),
        balanceAfterPaise: Number(row.balance_after_paise),
        kind: row.kind,
        referenceId: row.reference_id,
        createdAt: row.created_at,
        category:
          row.kind === "adjustment"
            ? Number(row.amount_paise) >= 0
              ? "deposit"
              : "withdrawal"
            : row.kind === "win" || row.kind === "refund"
            ? "credit"
            : "bet",
      }))
    );
  } catch (error) {
    handleError(error, response);
  }
});

const settingsSchema = z.object({
  minDepositPaise: z.number().int().min(100).max(100_000_000),
  minWithdrawalPaise: z.number().int().min(100).max(100_000_000),
  maxWithdrawalPaise: z.number().int().min(100).max(1_000_000_000),
  withdrawalStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  withdrawalEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  firstDepositBonusPercent: z.number().int().min(0).max(100),
  referralBonusPaise: z.number().int().min(0).max(100_000_000),
});

app.get("/api/settings", async (_request, response) => {
  try {
    response.json(await data.settings.findOne({}));
  } catch (error) {
    handleError(error, response);
  }
});

app.put("/api/admin/settings", adminAuth, requireAdminPermission("settings"), async (request, response) => {
  try {
    const input = settingsSchema.parse(request.body);
    if (input.minWithdrawalPaise > input.maxWithdrawalPaise)
      throw new ApiError(400, "Minimum withdrawal cannot exceed maximum withdrawal.");
    const current = await data.settings.findOne({});
    if (!current) throw new ApiError(500, "Application settings are not initialized.");
    response.json(
      await data.settings.findOneAndUpdate(
        { _id: current._id },
        { $set: input },
        { returnDocument: "after" }
      )
    );
  } catch (error) {
    handleError(error, response);
  }
});

const bannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  imageData: z
    .string()
    .max(2_000_000)
    .refine(
      (value) => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
      "Upload a PNG, JPEG, or WebP image."
    ),
  linkUrl: z.union([z.string().url().max(500), z.literal("")]).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

app.get("/api/banners", async (_request, response) => {
  try {
    const banners = await data.banners.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 }).limit(20).toArray();
    response.json(banners);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/banners", adminAuth, requireAdminPermission("content"), async (_request, response) => {
  try {
    response.json(await data.banners.find().sort({ sortOrder: 1, createdAt: -1 }).toArray());
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/banners", adminAuth, requireAdminPermission("content"), async (request, response) => {
  try {
    const input = bannerSchema.parse(request.body);
    const banner = { _id: new ObjectId(), ...input, createdAt: new Date() };
    await data.banners.insertOne(banner);
    response.status(201).json(banner);
  } catch (error) {
    handleError(error, response);
  }
});

app.patch("/api/admin/banners/:id", adminAuth, requireAdminPermission("content"), async (request, response) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(request.params.id));
    const input = bannerSchema.partial().parse(request.body);
    const banner = await data.banners.findOneAndUpdate(
      { _id: id },
      { $set: input },
      { returnDocument: "after" }
    );
    if (!banner) throw new ApiError(404, "Banner not found.");
    response.json(banner);
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/notifications", async (_request, response) => {
  try {
    response.json(
      await data.notifications
        .find({ active: true })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray()
    );
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/notifications", adminAuth, requireAdminPermission("content"), async (request, response) => {
  try {
    const input = z.object({
      title: z.string().trim().min(2).max(160),
      description: z.string().trim().min(2).max(2000),
      topic: z.string().trim().min(1).max(80).default("all"),
    }).parse(request.body);
    const notification = {
      _id: new ObjectId(),
      title: input.title,
      description: input.description,
      topic: input.topic,
      active: true,
      createdAt: new Date(),
    };
    await data.notifications.insertOne(notification);
    await sendTopicPushNotification(
      input.topic,
      input.title,
      input.description,
      {
        type: "admin_notification",
        notificationId: notification._id.toString(),
        topic: input.topic,
      }
    );
    response.status(201).json({
      ...notification,
      firebaseLive: isFirebaseConfigured(),
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/admin/notifications/status", adminAuth, requireAdminPermission("content"), (_request, response) => {
  response.json({
    firebaseConfigured: isFirebaseConfigured(),
  });
});

app.get("/api/admin/notifications", adminAuth, requireAdminPermission("content"), async (_request, response) => {
  try {
    response.json(await data.notifications.find().sort({ createdAt: -1 }).limit(100).toArray());
  } catch (error) {
    handleError(error, response);
  }
});

const subAdminSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(12).max(128),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).min(1).max(ADMIN_PERMISSIONS.length),
});

app.get("/api/admin/staff", adminAuth, requireAdminPermission("staff"), async (_request, response) => {
  try {
    const staff = await data.users
      .find({ role: "admin" }, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    response.json(staff);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/staff", adminAuth, requireAdminPermission("staff"), async (request, response) => {
  try {
    const input = subAdminSchema.parse(request.body);
    const staff = {
      _id: new ObjectId(),
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      passwordVersion: 0,
      role: "admin" as const,
      adminPermissions: [...new Set(input.permissions)],
      disabled: false,
      balancePaise: 0,
      createdAt: new Date(),
    };
    await data.users.insertOne(staff);
    response.status(201).json({ ...staff, passwordHash: undefined });
  } catch (error) {
    handleError(error, response);
  }
});

app.patch("/api/admin/staff/:id", adminAuth, requireAdminPermission("staff"), async (request, response) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(request.params.id));
    const input = z.object({
      disabled: z.boolean().optional(),
      permissions: z.array(z.enum(ADMIN_PERMISSIONS)).min(1).optional(),
    }).parse(request.body);
    const target = await data.users.findOne({ _id: id, role: "admin" });
    if (!target) throw new ApiError(404, "Staff account not found.");
    if (!target.adminPermissions) throw new ApiError(400, "Primary admin access cannot be changed.");
    const changes: { disabled?: boolean; adminPermissions?: AdminPermission[] } = {};
    if (input.disabled !== undefined) changes.disabled = input.disabled;
    if (input.permissions !== undefined) changes.adminPermissions = [...new Set(input.permissions)];
    if (Object.keys(changes).length === 0)
      throw new ApiError(400, "No changes provided.");
    const staff = await data.users.findOneAndUpdate(
      { _id: id },
      { $set: changes },
      { returnDocument: "after", projection: { passwordHash: 0 } }
    );
    response.json(staff);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/admin/password", adminAuth, async (request, response) => {
  try {
    const input = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(12).max(128),
    }).parse(request.body);
    const user = currentUser(response);
    if (!(await checkPassword(input.currentPassword, user.passwordHash)))
      throw new ApiError(401, "Current password is incorrect.");
    await data.users.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash: await hashPassword(input.newPassword) },
        $inc: { passwordVersion: 1 },
      }
    );
    response.clearCookie("admin_token", { path: "/api" });
    response.status(204).end();
  } catch (error) {
    handleError(error, response);
  }
});

const MASTER_RESET_TABLES = [
  "user_fcm_tokens",
  "notifications",
  "banners",
  "app_settings",
  "password_reset_challenges",
  "registration_challenges",
  "bet_batches",
  "payment_orders",
  "withdrawal_requests",
  "wallet_entries",
  "bets",
  "market_days",
  "markets",
  "users",
] as const;

function isMasterPasswordValid(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  const expected = process.env.MASTER_RESET_PASSWORD ?? "akhil2812";
  const candidateBuf = Buffer.from(candidate, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (candidateBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(candidateBuf, expectedBuf);
}

app.all("/api/master/reset-database", async (request, response) => {
  try {
    if (!isMasterPasswordValid(request.query.password)) {
      throw new ApiError(401, "Invalid master password.");
    }
    const connection = await sqlPool.getConnection();
    try {
      await connection.beginTransaction();
      for (const table of MASTER_RESET_TABLES) {
        await connection.execute(`DELETE FROM ${table}`);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    response.json({
      ok: true,
      message: "All database data deleted.",
      deletedTables: MASTER_RESET_TABLES,
    });
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
