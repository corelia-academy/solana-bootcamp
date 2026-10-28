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
  type SettleResponse,
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

const settled: SettleResponse = { success: true, transaction: "5sig", network: SOLANA_DEVNET, payer: "Payer" };

const facilitator = (overrides: Partial<FacilitatorPort> = {}): FacilitatorPort => ({
  verify: vi.fn().mockResolvedValue({ isValid: true, payer: "Payer" }),
  settle: vi.fn().mockResolvedValue(settled),
  ...overrides,
});

const run = (header: string | undefined, f = facilitator(), cache = new SettlementCache(), now = 0) =>
  gate({ paymentHeader: header, route, facilitator: f, cache, now });

describe("x402 v2 gate", () => {
  it("request đầu tiên trả 402 + header PAYMENT-REQUIRED đúng schema", async () => {
    const result = await run(undefined);
    expect(result.status).toBe(402);
    const body = decodeHeader<PaymentRequired>(result.headers[HEADERS.required]);
    expect(body.x402Version).toBe(2);
    expect(body.accepts[0]).toMatchObject({ scheme: "exact", network: SOLANA_DEVNET, asset: USDC_DEVNET, amount: "10000" });
  });

  it("payment hợp lệ: verify → settle → 200 + PAYMENT-RESPONSE", async () => {
    const f = facilitator();
    const result = await run(encodeHeader(payload()), f);
    expect(result.status).toBe(200);
    expect(decodeHeader<SettleResponse>(result.headers[HEADERS.response]).transaction).toBe("5sig");
    expect(f.verify).toHaveBeenCalledOnce();
    expect(f.settle).toHaveBeenCalledOnce();
  });

  it.each([
    ["amount thấp hơn", { amount: "1" }],
    ["sai payTo", { payTo: "Attacker111111111111111111111111111111111" }],
    ["sai asset", { asset: "FakeMint11111111111111111111111111111111111" }],
    ["sai network", { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" }],
  ])("từ chối accepted không khớp option đã công bố: %s", async (_name, overrides) => {
    const f = facilitator();
    const result = await run(encodeHeader(payload(overrides)), f);
    expect(result.status).toBe(402);
    expect(result.status === 402 && result.body.error).toBe("requirements_mismatch");
    expect(f.verify).not.toHaveBeenCalled();
  });

  it("payload hỏng hoặc sai version trả 402 invalid_payload", async () => {
    expect((await run("not-base64-json")).status).toBe(402);
    const v1 = await run(encodeHeader({ ...payload(), x402Version: 1 }));
    expect(v1.status === 402 && v1.body.error).toBe("invalid_payload");
  });

  it("verify thất bại trả 402 với lý do của facilitator, không settle", async () => {
    const f = facilitator({ verify: vi.fn().mockResolvedValue({ isValid: false, invalidReason: "insufficient_funds" }) });
    const result = await run(encodeHeader(payload()), f);
    expect(result.status === 402 && result.body.error).toBe("insufficient_funds");
    expect(f.settle).not.toHaveBeenCalled();
  });

  it("cùng transaction gửi lại bị chặn (replay)", async () => {
    const cache = new SettlementCache();
    expect((await run(encodeHeader(payload()), facilitator(), cache)).status).toBe(200);
    const replay = await run(encodeHeader(payload()), facilitator(), cache, 1_000);
    expect(replay.status === 402 && replay.body.error).toBe("duplicate_payment");
  });

  it("request đồng thời cùng payload chỉ settle một lần", async () => {
    const f = facilitator();
    const cache = new SettlementCache();
    const header = encodeHeader(payload());
    const results = await Promise.all([run(header, f, cache), run(header, f, cache), run(header, f, cache)]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(f.settle).toHaveBeenCalledOnce();
  });

  it("facilitator timeout trả 502 retryable và cho phép retry cùng payload", async () => {
    const cache = new SettlementCache();
    const down = facilitator({ verify: vi.fn().mockRejectedValue(new Error("timeout")) });
    const first = await run(encodeHeader(payload()), down, cache);
    expect(first).toMatchObject({ status: 502, body: { retryable: true } });
    expect((await run(encodeHeader(payload()), facilitator(), cache)).status).toBe(200);
  });

  it("cache hết hạn sau TTL", () => {
    const cache = new SettlementCache(120_000);
    expect(cache.claim("tx", 0)).toBe(true);
    expect(cache.claim("tx", 60_000)).toBe(false);
    expect(cache.claim("tx", 120_001)).toBe(true);
  });
});
