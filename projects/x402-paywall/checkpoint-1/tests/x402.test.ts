import { describe, expect, it, vi } from "vitest";
import {
  HEADERS,
  SOLANA_DEVNET,
  SettlementCache,
  USDC_DEVNET,
  decodeHeader,
  encodeHeader,
  gate,
  type FacilitatorPort,
  type PaymentPayload,
  type PaymentRequired,
  type RouteConfig,
} from "../src/x402.js";

const payTo = "Merchant1111111111111111111111111111111111";
const route: RouteConfig = {
  resource: { url: "http://localhost:4021/data", description: "Bootcamp data", mimeType: "application/json" },
  accepts: [
    {
      scheme: "exact",
      network: SOLANA_DEVNET,
      asset: USDC_DEVNET,
      amount: "10000",
      payTo,
      maxTimeoutSeconds: 60,
      extra: { feePayer: "Facilitator11111111111111111111111111111111" },
    },
  ],
};

const payload = (overrides: Partial<PaymentPayload["accepted"]> = {}, tx = "signed-tx-base64"): PaymentPayload => ({
  x402Version: 2,
  resource: route.resource,
  accepted: { ...route.accepts[0], ...overrides },
  payload: { transaction: tx },
});

const facilitator = (overrides: Partial<FacilitatorPort> = {}): FacilitatorPort => ({
  verify: vi.fn().mockResolvedValue({ isValid: true, payer: "Payer" }),
  settle: vi.fn(),
  ...overrides,
});

const run = (header: string | undefined, f = facilitator(), cache = new SettlementCache(), now = 0) =>
  gate({ paymentHeader: header, route, facilitator: f, cache, now });

describe("x402 v2 challenge", () => {
  it("request đầu tiên trả 402 + header PAYMENT-REQUIRED đúng schema", async () => {
    const result = await run(undefined);
    expect(result.status).toBe(402);
    const body = decodeHeader<PaymentRequired>(result.headers[HEADERS.required]);
    expect(body.x402Version).toBe(2);
    expect(body.accepts[0]).toMatchObject({ scheme: "exact", network: SOLANA_DEVNET, asset: USDC_DEVNET, amount: "10000" });
  });

  it.each([
    ["amount thấp hơn", { amount: "1" }],
    ["sai payTo", { payTo: "Attacker111111111111111111111111111111111" }],
  ])("từ chối accepted không khớp option đã công bố: %s", async (_name, overrides) => {
    const result = await run(encodeHeader(payload(overrides)));
    expect(result.status === 402 && result.body.error).toBe("requirements_mismatch");
  });

  it("payload hỏng trả 402 invalid_payload", async () => {
    const result = await run("not-base64-json");
    expect(result.status === 402 && result.body.error).toBe("invalid_payload");
  });

  it.skip("Checkpoint 2: verify/settle, replay, concurrency, timeout", () => {});
});
