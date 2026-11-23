import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "./db.ts";
import type { Request, Response, NextFunction } from "express";
import type { User } from "./db.ts";

const secretText = process.env.JWT_SECRET;
if (!secretText || secretText.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}
const secret = new TextEncoder().encode(secretText);

export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    throw error;
  }
}

export async function checkPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw error;
  }
}

export async function issueToken(user: User): Promise<string> {
  try {
    return await new SignJWT({
      role: user.role,
      version: user.passwordVersion ?? 0,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user._id.toHexString())
      .setIssuedAt()
      .setExpirationTime("12h")
      .sign(secret);
  } catch (error) {
    throw error;
  }
}

export function cookieToken(request: Request): string | undefined {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("admin_token="));
  return cookie?.slice("admin_token=".length);
}

export function authMiddleware(
  getUser: (id: ObjectId) => Promise<User | null>,
  role?: User["role"]
) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bearer = request.headers.authorization?.startsWith("Bearer ")
        ? request.headers.authorization.slice(7)
        : undefined;
      const token = bearer ?? cookieToken(request);
      if (!token) {
        response.status(401).json({ error: "Authentication required." });
        return;
      }
      const { payload } = await jwtVerify(token, secret);
      if (!payload.sub || !ObjectId.isValid(payload.sub)) {
        response.status(401).json({ error: "Invalid session." });
        return;
      }
      const user = await getUser(new ObjectId(payload.sub));
      if (
        !user ||
        user.disabled ||
        payload.version !== (user.passwordVersion ?? 0) ||
        (role && user.role !== role)
      ) {
        response.status(403).json({ error: "Access denied." });
        return;
      }
      response.locals.user = user;
      next();
    } catch {
      response.status(401).json({ error: "Invalid or expired session." });
    }
  };
}

export function currentUser(response: Response): User {
  return response.locals.user as User;
}
