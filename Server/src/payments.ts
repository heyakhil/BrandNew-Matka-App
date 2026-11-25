import { createHmac, timingSafeEqual } from "node:crypto";
import {
  client,
  collections,
  ObjectId,
  type PaymentOrder,
  type User,
} from "./db.ts";
import { ApiError } from "./game.ts";

type Data = ReturnType<typeof collections>;

interface Pay0Config {
  apiUrl: string;
  publicApiUrl: string;
  token: string;
}

interface Pay0CreateResult {
  paymentUrl: string;
  providerOrderId: string;
}

interface ProviderPaymentStatus {
  status: PaymentOrder["status"];
  amountPaise?: number;
}

export interface PaymentStatus {
  orderId: string;
  amountPaise: number;
  status: PaymentOrder["status"];
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const readString = (record: JsonRecord, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

function config(): Pay0Config {
  const token = process.env.PAY0_USER_TOKEN?.trim();
  const publicApiUrl = process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!token)
    throw new ApiError(503, "Payment gateway is not configured.");
  if (!publicApiUrl)
    throw new ApiError(503, "Public payment callback URL is not configured.");
  const isProduction = process.env.NODE_ENV === "production";
  const validProtocol = isProduction ? /^https:\/\//i : /^https?:\/\//i;
  if (!validProtocol.test(publicApiUrl))
    throw new ApiError(503, "Payment callback URL uses an invalid protocol.");
  const apiUrl = (process.env.PAY0_API_URL ?? "https://api.pay0.shop/apiv1")
    .trim()
    .replace(/\/+$/, "");
  return { apiUrl, publicApiUrl, token };
}

async function postForm(
  url: string,
  values: Record<string, string>
): Promise<JsonRecord> {
  const body = new URLSearchParams(values);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error(`Pay0 request failed for ${url}:`, error);
    throw new ApiError(502, "Payment gateway is temporarily unavailable.");
  }

  const raw = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error(`Pay0 returned invalid JSON for ${url}.`);
    throw new ApiError(502, "Payment gateway returned an invalid response.");
  }
  if (!response.ok || !isRecord(payload))
    throw new ApiError(502, "Payment gateway rejected the request.");
  return payload;
}

function providerOrderStatus(payload: JsonRecord): string | null {
  const result = isRecord(payload.result)
    ? payload.result
    : isRecord(payload.data)
      ? payload.data
      : payload;
  return (
    readString(result, ["status", "txnStatus", "txn_status", "payment_status"]) ??
    readString(payload, ["txnStatus", "txn_status", "payment_status"])
  )?.toUpperCase() ?? null;
}

function isPaid(status: string | null): boolean {
  return (
    status !== null &&
    ["SUCCESS", "PAID", "COMPLETED", "TXN_SUCCESS"].includes(status)
  );
}

function isPending(status: string | null): boolean {
  return (
    status === null ||
    ["CREATED", "INITIATED", "PENDING", "PROCESSING"].includes(status)
  );
}

export function pay0StatusFromPayload(payload: unknown): "paid" | "processing" | "failed" {
  if (!isRecord(payload)) return "processing";
  const status = providerOrderStatus(payload);
  if (isPaid(status)) return "paid";
  return isPending(status) ? "processing" : "failed";
}

export function isValidPay0WebhookSignature(
  orderId: string,
  receivedHash: string,
  secret: string
): boolean {
  if (!secret || !/^[\da-f]{64}$/i.test(receivedHash)) return false;
  const expected = createHmac("sha256", secret).update(orderId).digest();
  const received = Buffer.from(receivedHash, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function verifyPay0WebhookSignature(
  orderId: string,
  receivedHash: string
): boolean {
  const secret = process.env.PAY0_SECRET?.trim();
  if (!secret)
    throw new ApiError(503, "Payment webhook secret is not configured.");
  return isValidPay0WebhookSignature(orderId, receivedHash, secret);
}

function providerAmountPaise(payload: JsonRecord): number | undefined {
  const result = isRecord(payload.result)
    ? payload.result
    : isRecord(payload.data)
      ? payload.data
      : payload;
  const amount = result.amount;
  const text =
    typeof amount === "string"
      ? amount.trim()
      : typeof amount === "number" && Number.isFinite(amount)
        ? String(amount)
        : "";
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return undefined;
  const paise =
    Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(paise) ? paise : undefined;
}

async function getProviderStatus(
  gateway: Pay0Config,
  providerOrderId: string
): Promise<ProviderPaymentStatus> {
  const payload = await postForm(`${gateway.apiUrl}/check-order-status`, {
    user_token: gateway.token,
    order_id: providerOrderId,
  });
  if (payload.status === false || payload.status === 0 || payload.status === "0")
    throw new ApiError(
      502,
      readString(payload, ["message"]) ?? "Payment status could not be verified."
    );
  const status = pay0StatusFromPayload(payload);
  if (status === "paid") {
    const amountPaise = providerAmountPaise(payload);
    if (amountPaise === undefined)
      throw new ApiError(502, "Payment gateway returned an invalid paid amount.");
    return { status, amountPaise };
  }
  return { status };
}

async function updateOrderStatus(
  data: Data,
  providerOrderId: string,
  providerStatus: ProviderPaymentStatus
): Promise<PaymentStatus> {
  return client.withSession(async (session) =>
    session.withTransaction(async () => {
      const order = await data.paymentOrders.findOne(
        { providerOrderId },
        { session, lock: true }
      );
      if (!order) throw new ApiError(404, "Payment order not found.");
      if (order.status === "paid") return toPaymentStatus(order);

      if (providerStatus.status === "paid") {
        if (providerStatus.amountPaise !== order.amountPaise)
          throw new ApiError(502, "Payment amount does not match the created order.");
        const user = await data.users.findOne(
          { _id: order.userId, role: "player", disabled: false },
          { session, lock: true }
        );
        if (!user) throw new ApiError(404, "Active player not found.");
        const nextBalance = user.balancePaise + order.amountPaise;
        if (!Number.isSafeInteger(nextBalance))
          throw new ApiError(400, "Wallet balance exceeds the safe calculation limit.");
        const userUpdate = await data.users.updateOne(
          { _id: user._id, balancePaise: user.balancePaise },
          { $set: { balancePaise: nextBalance } },
          { session }
        );
        if (userUpdate.modifiedCount !== 1)
          throw new ApiError(409, "Wallet changed; retry the payment check.");
        await data.entries.insertOne(
          {
            _id: new ObjectId(),
            userId: user._id,
            amountPaise: order.amountPaise,
            balanceAfterPaise: nextBalance,
            kind: "adjustment",
            referenceId: `pay0:${providerOrderId}`,
            createdAt: new Date(),
          },
          { session }
        );
      }

      const nextStatus = order.status === "failed" && providerStatus.status === "processing"
        ? order.status
        : providerStatus.status;
      const updated = await data.paymentOrders.findOneAndUpdate(
        { _id: order._id },
        { $set: { status: nextStatus, updatedAt: new Date() } },
        { session, returnDocument: "after" }
      );
      if (!updated) throw new ApiError(404, "Payment order not found.");
      return toPaymentStatus(updated);
    })
  );
}

function toPaymentStatus(order: PaymentOrder): PaymentStatus {
  return {
    orderId: order.providerOrderId,
    amountPaise: order.amountPaise,
    status: order.status,
  };
}

export async function createPay0Payment(
  data: Data,
  user: User,
  amountPaise: number
): Promise<Pay0CreateResult> {
  const gateway = config();
  const settings = await data.settings.findOne({});
  const configuredMinimum = settings?.minDepositPaise ?? 10_000;
  const minimum =
    process.env.NODE_ENV === "production" ? configuredMinimum : Math.min(configuredMinimum, 100);
  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise < minimum ||
    amountPaise > 100_000_000
  )
    throw new ApiError(400, `Deposit amount must be between ₹${minimum / 100} and ₹1000000.`);

  const providerOrderId = `rcm${new ObjectId().toHexString()}`;
  const now = new Date();
  await data.paymentOrders.insertOne({
    _id: new ObjectId(),
    userId: user._id,
    providerOrderId,
    amountPaise,
    status: "processing",
    createdAt: now,
    updatedAt: now,
  });

  const redirectUrl = `${gateway.publicApiUrl}/payments/pay0/redirect?order_id=${encodeURIComponent(providerOrderId)}`;
  try {
    const payload = await postForm(`${gateway.apiUrl}/create-order`, {
      customer_mobile: user.phone ?? "",
      customer_name: user.name || "Royal Club Player",
      user_token: gateway.token,
      amount: String(amountPaise / 100),
      order_id: providerOrderId,
      redirect_url: redirectUrl,
      remark1: "Royal Club wallet deposit",
      remark2: user._id.toHexString(),
    });
    if (payload.status !== true && payload.status !== 1 && payload.status !== "1")
      throw new ApiError(
        502,
        readString(payload, ["message"]) ?? "Payment gateway rejected the order."
      );
    const result = isRecord(payload.result) ? payload.result : {};
    const paymentUrl = readString(result, ["payment_url", "paymentUrl"]);
    if (!paymentUrl)
      throw new ApiError(502, "Payment gateway did not return a payment URL.");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(paymentUrl);
    } catch {
      throw new ApiError(502, "Payment gateway returned an invalid payment URL.");
    }
    if (parsedUrl.protocol !== "https:")
      throw new ApiError(502, "Payment gateway returned an invalid payment URL.");

    await data.paymentOrders.updateOne(
      { providerOrderId },
      { $set: { paymentUrl, updatedAt: new Date() } }
    );
    return { providerOrderId, paymentUrl };
  } catch (error) {
    await data.paymentOrders.updateOne(
      { providerOrderId, status: "processing" },
      { $set: { status: "failed", updatedAt: new Date() } }
    );
    throw error;
  }
}

export async function reconcilePay0Payment(
  data: Data,
  providerOrderId: string
): Promise<PaymentStatus> {
  const order = await data.paymentOrders.findOne({ providerOrderId });
  if (!order) throw new ApiError(404, "Payment order not found.");
  if (order.status !== "processing") return toPaymentStatus(order);

  const status = await getProviderStatus(config(), providerOrderId);
  if (status.status === "processing") return toPaymentStatus(order);
  return updateOrderStatus(data, providerOrderId, status);
}

export async function reconcileUserPayment(
  data: Data,
  userId: ObjectId,
  providerOrderId: string
): Promise<PaymentStatus> {
  const order = await data.paymentOrders.findOne({
    userId,
    providerOrderId,
  });
  if (!order) throw new ApiError(404, "Payment order not found.");
  return reconcilePay0Payment(data, providerOrderId);
}
