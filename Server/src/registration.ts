import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { type RowDataPacket } from "mysql2/promise";
import { hashPassword, issueToken } from "./auth.ts";
import { client, collections, ObjectId, sqlPool, type User } from "./db.ts";
import { ApiError } from "./game.ts";
import { sendRenflairOtp, type SendOtp } from "./sms.ts";
import type { z } from "zod";
import type { playerRegisterSchema } from "./validation.ts";

type Registration = z.infer<typeof playerRegisterSchema>;
interface ChallengeRow extends RowDataPacket {
  id: string;
  phone: string;
  name: string;
  dob: string;
  password_hash: string;
  code_hash: string;
  expires_at: Date;
  last_sent_at: Date;
  attempts: number;
}

const otpHash = (id: string, otp: string): Buffer =>
  createHmac("sha256", process.env.JWT_SECRET ?? "")
    .update(`registration:${id}:${otp}`)
    .digest();

export async function startRegistration(input: Registration, sendOtp: SendOtp = sendRenflairOtp): Promise<string> {
  if (await collections().users.findOne({ phone: input.phone, role: "player" }))
    throw new ApiError(409, "Mobile number is already registered.");
  const passwordHash = await hashPassword(input.password);
  const otp = String(randomInt(0, 10_000)).padStart(4, "0");
  const id = new ObjectId().toHexString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  await client.withSession(async session => {
    await session.withTransaction(async () => {
      const [rows] = await session.connection.execute<ChallengeRow[]>(
        "SELECT id, last_sent_at FROM registration_challenges WHERE phone = ? FOR UPDATE",
        [input.phone]
      );
      if (rows[0] && now.getTime() - new Date(rows[0].last_sent_at).getTime() < 60_000)
        throw new ApiError(429, "Wait a minute before requesting another code.");
      if (rows[0]) {
        await session.connection.execute(
          "UPDATE registration_challenges SET id = ?, name = ?, dob = ?, password_hash = ?, code_hash = ?, expires_at = ?, last_sent_at = ?, attempts = 0 WHERE phone = ?",
          [id, input.name, input.dob, passwordHash, otpHash(id, otp).toString("hex"), expiresAt, now, input.phone]
        );
      } else {
        await session.connection.execute(
          "INSERT INTO registration_challenges (id, phone, name, dob, password_hash, code_hash, expires_at, last_sent_at, attempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
          [id, input.phone, input.name, input.dob, passwordHash, otpHash(id, otp).toString("hex"), expiresAt, now]
        );
      }
    });
  });
  try {
    await sendOtp(input.phone, otp);
    return id;
  } catch (error) {
    await sqlPool.execute("DELETE FROM registration_challenges WHERE id = ?", [id]);
    throw error;
  }
}

export async function verifyRegistration(challengeId: string, otp: string): Promise<{ token: string; user: User }> {
  const outcome = await client.withSession(async session => session.withTransaction(async () => {
    const [rows] = await session.connection.execute<ChallengeRow[]>(
      "SELECT * FROM registration_challenges WHERE id = ? FOR UPDATE", [challengeId]
    );
    const challenge = rows[0];
    if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now())
      throw new ApiError(400, "Code expired. Request a new one.");
    if (challenge.attempts >= 5) throw new ApiError(429, "Too many attempts. Request a new code.");
    const valid = timingSafeEqual(
      Buffer.from(challenge.code_hash, "hex"), otpHash(challengeId, otp)
    );
    if (!valid) {
      await session.connection.execute(
        "UPDATE registration_challenges SET attempts = attempts + 1 WHERE id = ?", [challengeId]
      );
      return null;
    }
    const user: User = {
      _id: new ObjectId(), name: challenge.name, phone: challenge.phone,
      dob: challenge.dob, referralCode: randomBytes(8).toString("hex").toUpperCase(),
      passwordHash: challenge.password_hash, passwordVersion: 0,
      role: "player", disabled: false, balancePaise: 0, createdAt: new Date(),
    };
    await collections().users.insertOne(user, { session });
    await session.connection.execute("DELETE FROM registration_challenges WHERE id = ?", [challengeId]);
    return user;
  }));
  if (!outcome) throw new ApiError(400, "Incorrect verification code.");
  return { token: await issueToken(outcome), user: outcome };
}

export async function pruneExpiredAuthRecords(): Promise<void> {
  await sqlPool.execute(
    "DELETE FROM registration_challenges WHERE expires_at < UTC_TIMESTAMP() - INTERVAL 1 DAY"
  );
  await sqlPool.execute(
    "DELETE FROM password_reset_challenges WHERE expires_at < UTC_TIMESTAMP() - INTERVAL 1 DAY"
  );
}
