import "dotenv/config";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { test } from "node:test";
import { ObjectId } from "../src/id.ts";
import {
  DEFAULT_RATE_CARD,
  DEFAULT_STAKE_LIMITS,
} from "../../packages/matka-rules/src/index.ts";
import type { Market, User } from "../src/db.ts";

test(
  "bet, declaration, duplicate, reversal, correction and cancellation keep the wallet exact",
  { skip: !process.env.MYSQL_TEST_DATABASE },
  async (context) => {
    context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-23T05:00:00.000Z") });
    try {
      process.env.MYSQL_DATABASE = process.env.MYSQL_TEST_DATABASE;
      process.env.JWT_SECRET =
        "integration-test-secret-at-least-thirty-two-characters";
      process.env.ADMIN_ORIGIN = "http://localhost:5173";
      process.env.PORT = "0";
      const { client, connectDatabase } = await import("../src/db.ts");
      const {
        adjustWallet,
        cancelMarketDay,
        declareResult,
        marketDate,
        placeBets,
        reverseResult,
      } = await import("../src/game.ts");
      try {
        const data = await connectDatabase();
        const suffix = new ObjectId().toHexString().slice(0, 10);
        const adminEmail = `admin-${suffix}@example.com`;
        const user: User = {
          _id: new ObjectId(),
          email: `player-${suffix}@example.com`,
          passwordHash: "unused",
          role: "player",
          disabled: false,
          balancePaise: 0,
          createdAt: new Date(),
        };
        const market: Market = {
          _id: new ObjectId(),
          slug: `test-${suffix}`,
          name: "Test",
          openTime: "23:00",
          closeTime: "23:59",
          timezone: "Asia/Kolkata",
          cutoffMinutes: 10,
          active: true,
          rateCard: DEFAULT_RATE_CARD,
          limits: DEFAULT_STAKE_LIMITS,
        };
        await data.users.insertOne(user);
        await data.markets.insertOne(market);
        await adjustWallet(data, user._id, 100_000, "payment-test-001");
        const date = marketDate(new Date(), market);
        const bets = await placeBets(
          data,
          user,
          market._id,
          [
            { game: "single", side: "open", ank: 0, stakePaise: 10_000 },
            { game: "jodi", jodi: "02", stakePaise: 10_000 },
          ],
          "test-request-id-001"
        );
        assert.equal(bets.length, 2);
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          80_000
        );
        const repeated = await placeBets(
          data,
          user,
          market._id,
          [
            { game: "single", side: "open", ank: 0, stakePaise: 10_000 },
            { game: "jodi", jodi: "02", stakePaise: 10_000 },
          ],
          "test-request-id-001"
        );
        assert.deepEqual(
          repeated.map((bet) => bet._id.toHexString()),
          bets.map((bet) => bet._id.toHexString())
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          80_000
        );
        assert.deepEqual(
          await declareResult(data, market._id, date, "open", "974"),
          { line: "479-0", creditedPaise: 95_000, noop: false }
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          175_000
        );
        assert.equal(
          (await declareResult(data, market._id, date, "open", "479")).noop,
          true
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          175_000
        );
        assert.deepEqual(
          await declareResult(data, market._id, date, "close", "994"),
          { line: "479-02-499", creditedPaise: 950_000, noop: false }
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          1_125_000
        );
        assert.equal(
          await reverseResult(data, market._id, date, "close"),
          950_000
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          175_000
        );
        assert.deepEqual(
          await declareResult(data, market._id, date, "close", "458"),
          { line: "479-07-458", creditedPaise: 0, noop: false }
        );
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          175_000
        );
        assert.equal(await cancelMarketDay(data, market._id, date), 0);
        assert.equal(
          (await data.users.findOne({ _id: user._id }))?.balancePaise,
          175_000
        );
        const { hashPassword } = await import("../src/auth.ts");
        await data.users.insertOne({
          _id: new ObjectId(),
          email: adminEmail,
          passwordHash: await hashPassword("strong-password-123"),
          role: "admin",
          disabled: false,
          balancePaise: 0,
          createdAt: new Date(),
        });
        const { server } = await import("../src/index.ts");
        try {
          const address = server.address();
          if (!address || typeof address === "string")
            throw new Error("Server address unavailable.");
          const api = `http://127.0.0.1:${address.port}/api`;
          const login = await fetch(`${api}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: adminEmail,
              password: "strong-password-123",
            }),
          });
          assert.equal(login.status, 200);
          const cookie = login.headers.get("set-cookie")?.split(";")[0];
          if (!cookie?.startsWith("admin_token="))
            throw new Error("Admin cookie missing.");
          const session = await fetch(`${api}/admin/session`, {
            headers: { Cookie: cookie },
          });
          assert.equal(session.status, 200);
          const phone = String(randomInt(1_000_000_000, 9_999_999_998));
          const { startRegistration, verifyRegistration } = await import("../src/registration.ts");
          let sentOtp = "";
          const challengeId = await startRegistration({
            name: "Test Player", phone, dob: "1995-04-12",
            password: "player-password-123", confirmPassword: "player-password-123",
          }, async (_phone, code) => { sentOtp = code; });
          assert.match(sentOtp, /^\d{4}$/);
          await assert.rejects(verifyRegistration(challengeId, sentOtp === "0000" ? "0001" : "0000"));
          const registered = await fetch(`${api}/auth/register/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId, otp: sentOtp }),
          });
          assert.equal(registered.status, 201);
          const registration = (await registered.json()) as { token: string };
          const account = await fetch(`${api}/me`, {
            headers: { Authorization: `Bearer ${registration.token}` },
          });
          assert.equal(account.status, 200);
          const { dob } = (await account.json()) as {
            dob: string;
          };
          assert.equal(dob, "1995-04-12");
          const playerLogin = await fetch(`${api}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password: "player-password-123" }),
          });
          assert.equal(playerLogin.status, 200);
          const { startPasswordReset, verifyPasswordReset, finishPasswordReset } = await import("../src/passwordReset.ts");
          let resetOtp = "";
          const resetChallenge = await startPasswordReset(phone, async (_phone, code) => { resetOtp = code; });
          assert.match(resetOtp, /^\d{4}$/);
          await assert.rejects(verifyPasswordReset(resetChallenge, resetOtp === "0000" ? "0001" : "0000"));
          const verifiedReset = await fetch(`${api}/auth/password-reset/verify`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: resetChallenge, otp: resetOtp }),
          });
          assert.equal(verifiedReset.status, 200);
          const { resetToken } = (await verifiedReset.json()) as { resetToken: string };
          assert.match(resetToken, /^[\da-f]{64}$/);
          await assert.rejects(verifyPasswordReset(resetChallenge, resetOtp));
          await assert.rejects(finishPasswordReset(resetChallenge, "a".repeat(64), "new-password-123"));
          const finishedReset = await fetch(`${api}/auth/password-reset/finish`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: resetChallenge, resetToken,
              password: "new-password-123", confirmPassword: "new-password-123" }),
          });
          assert.equal(finishedReset.status, 204);
          await assert.rejects(finishPasswordReset(resetChallenge, resetToken, "new-password-123"));
          const oldLogin = await fetch(`${api}/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password: "player-password-123" }),
          });
          assert.equal(oldLogin.status, 401);
          const newLogin = await fetch(`${api}/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password: "new-password-123" }),
          });
          assert.equal(newLogin.status, 200);
          const priorDate = new Date(`${date}T00:00:00.000Z`);
          priorDate.setUTCDate(priorDate.getUTCDate() - 1);
          const apiDate = priorDate.toISOString().slice(0, 10);
          const declareBody = {
            marketId: market._id.toHexString(),
            date: apiDate,
            side: "open",
            panna: "479",
          };
          const declared = await fetch(`${api}/admin/results/declare`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
              Origin: "http://localhost:5173",
            },
            body: JSON.stringify(declareBody),
          });
          assert.equal(declared.status, 200);
          const duplicate = await fetch(`${api}/admin/results/declare`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
              Origin: "http://localhost:5173",
            },
            body: JSON.stringify({ ...declareBody, panna: "974" }),
          });
          assert.equal(duplicate.status, 200);
          assert.equal(
            ((await duplicate.json()) as { noop: boolean }).noop,
            true
          );
          const otherMarket: Market = {
            ...market,
            _id: new ObjectId(),
            slug: `off-test-${suffix}`,
          };
          await data.markets.insertOne(otherMarket);
          await placeBets(data, user, otherMarket._id, [
            { game: "single", side: "close", ank: 9, stakePaise: 1000 },
          ]);
          assert.equal(
            (await data.users.findOne({ _id: user._id }))?.balancePaise,
            174_000
          );
          const off = await fetch(`${api}/admin/markets/${otherMarket._id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
              Origin: "http://localhost:5173",
            },
            body: JSON.stringify({ active: false }),
          });
          assert.equal(off.status, 200);
          assert.equal(
            (await data.users.findOne({ _id: user._id }))?.balancePaise,
            175_000
          );
          const wrongOrigin = await fetch(`${api}/admin/results/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
              Origin: "http://evil.example",
            },
            body: JSON.stringify({ marketId: market._id.toHexString(), date }),
          });
          assert.equal(wrongOrigin.status, 403);
        } finally {
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
          );
        }
      } finally {
        await client.close();
      }
    } catch (error) {
      throw error;
    }
  }
);
