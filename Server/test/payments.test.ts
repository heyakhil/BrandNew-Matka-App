import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidPay0WebhookSignature,
  pay0StatusFromPayload,
} from "../src/payments.ts";

test("normalizes Pay0 payment status variants", () => {
  assert.equal(
    pay0StatusFromPayload({ result: { status: "SUCCESS" } }),
    "paid"
  );
  assert.equal(pay0StatusFromPayload({ txn_status: "TXN_SUCCESS" }), "paid");
  assert.equal(
    pay0StatusFromPayload({ result: { txnStatus: "PROCESSING" } }),
    "processing"
  );
  assert.equal(
    pay0StatusFromPayload({ result: { payment_status: "FAILED" } }),
    "failed"
  );
});

test("keeps incomplete Pay0 status payloads pending", () => {
  assert.equal(pay0StatusFromPayload({}), "processing");
  assert.equal(pay0StatusFromPayload(null), "processing");
  assert.equal(
    pay0StatusFromPayload({ status: true, result: {} }),
    "processing"
  );
});

test("verifies Pay0 webhook signatures in constant time", () => {
  const signature =
    "a780d281202269781a4f112160624ef2406b311d327d19b180aa8f55f634756d";
  assert.equal(
    isValidPay0WebhookSignature("rcm-order-123", signature, "pay0-test-secret"),
    true
  );
  assert.equal(
    isValidPay0WebhookSignature(
      "rcm-order-123",
      signature.replace("a", "b"),
      "pay0-test-secret"
    ),
    false
  );
  assert.equal(
    isValidPay0WebhookSignature("rcm-order-124", signature, "pay0-test-secret"),
    false
  );
  assert.equal(
    isValidPay0WebhookSignature("rcm-order-123", "not-a-hash", "pay0-test-secret"),
    false
  );
});
