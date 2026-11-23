import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { hashPassword } from "./auth.ts";
import { client, collections, ObjectId, sqlPool } from "./db.ts";
import { ApiError } from "./game.ts";
import { sendRenflairOtp, type SendOtp } from "./sms.ts";

interface ResetRow extends RowDataPacket {
  id: string;
  user_id: string;
  code_hash: string | null;
  token_hash: string | null;
  expires_at: Date;
  last_sent_at: Date;
  attempts: number;
}

const codeHash = (id: string, code: string): Buffer =>
  createHmac("sha256", process.env.JWT_SECRET ?? "")
    .update(`password-reset:${id}:${code}`)
    .digest();

const tokenHash = (token: string): Buffer => createHash("sha256").update(token).digest();

export async function startPasswordReset(
  phone: string,
  sendOtp: SendOtp = sendRenflairOtp
): Promise<string> {
  const user = await collections().users.findOne({ phone, role: "player", disabled: false });
  if (!user) throw new ApiError(404, "Account not found for this mobile number.");
  const id = new ObjectId().toHexString();
  const code = String(randomInt(0, 10_000)).padStart(4, "0");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  await client.withSession(async session => {
    await session.withTransaction(async () => {
      const [rows] = await session.connection.execute<ResetRow[]>(
        "SELECT id, last_sent_at FROM password_reset_challenges WHERE user_id = ? FOR UPDATE",
        [user._id.toHexString()]
      );
      if (rows[0] && now.getTime() - new Date(rows[0].last_sent_at).getTime() < 60_000)
        throw new ApiError(429, "Wait a minute before requesting another code.");
      if (rows[0]) {
        await session.connection.execute(
          "UPDATE password_reset_challenges SET id = ?, code_hash = ?, token_hash = NULL, expires_at = ?, last_sent_at = ?, attempts = 0 WHERE user_id = ?",
          [id, codeHash(id, code).toString("hex"), expiresAt, now, user._id.toHexString()]
        );
      } else {
        await session.connection.execute(
          "INSERT INTO password_reset_challenges (id, user_id, code_hash, expires_at, last_sent_at, attempts) VALUES (?, ?, ?, ?, ?, 0)",
          [id, user._id.toHexString(), codeHash(id, code).toString("hex"), expiresAt, now]
        );
      }
    });
  });
  try {
    await sendOtp(phone, code);
    return id;
  } catch (error) {
    await sqlPool.execute("DELETE FROM password_reset_challenges WHERE id = ?", [id]);
    throw error;
  }
}

export async function verifyPasswordReset(challengeId: string, code: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const verified = await client.withSession(async session => session.withTransaction(async () => {
    const [rows] = await session.connection.execute<ResetRow[]>(
      "SELECT * FROM password_reset_challenges WHERE id = ? FOR UPDATE", [challengeId]
    );
    const challenge = rows[0];
    if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now() || !challenge.code_hash)
      throw new ApiError(400, "Code expired. Request a new one.");
    if (challenge.attempts >= 5) throw new ApiError(429, "Too many attempts. Request a new code.");
    if (!timingSafeEqual(Buffer.from(challenge.code_hash, "hex"), codeHash(challengeId, code))) {
      await session.connection.execute(
        "UPDATE password_reset_challenges SET attempts = attempts + 1 WHERE id = ?", [challengeId]
      );
      return false;
    }
    await session.connection.execute(
      "UPDATE password_reset_challenges SET code_hash = NULL, token_hash = ? WHERE id = ?",
      [tokenHash(token).toString("hex"), challengeId]
    );
    return true;
  }));
  if (!verified) throw new ApiError(400, "Incorrect verification code.");
  return token;
}

export async function finishPasswordReset(
  challengeId: string,
  resetToken: string,
  password: string
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await client.withSession(async session => {
    await session.withTransaction(async () => {
      const [rows] = await session.connection.execute<ResetRow[]>(
        "SELECT * FROM password_reset_challenges WHERE id = ? FOR UPDATE", [challengeId]
      );
      const challenge = rows[0];
      if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now() || !challenge.token_hash)
        throw new ApiError(400, "Verification expired. Request a new code.");
      if (!timingSafeEqual(Buffer.from(challenge.token_hash, "hex"), tokenHash(resetToken)))
        throw new ApiError(401, "Invalid password reset verification.");
      const user = await collections().users.findOne(
        { _id: new ObjectId(challenge.user_id), role: "player", disabled: false },
        { session, lock: true }
      );
      if (!user) throw new ApiError(404, "Account unavailable.");
      await collections().users.updateOne(
        { _id: user._id },
        { $set: { passwordHash }, $inc: { passwordVersion: 1 } },
        { session }
      );
      await session.connection.execute("DELETE FROM password_reset_challenges WHERE id = ?", [challengeId]);
    });
  });
}
