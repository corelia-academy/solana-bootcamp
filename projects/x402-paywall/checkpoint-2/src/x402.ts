/**
 * Lõi giao thức x402 v2 (scheme `exact`, Solana) viết tay để học.
 *
 * Final sẽ nối lõi này với SDK chính thức (@x402/express, @x402/fetch) để chạy trên Devnet.
 *
 * Luồng v2:
 *   1. Client gọi resource, không có header thanh toán.
 *   2. Server trả 402 + header `PAYMENT-REQUIRED` (base64 JSON `PaymentRequired`).
 *   3. Client chọn một mục trong `accepts`, KÝ (chưa gửi) một transaction SPL transferChecked,
 *      rồi gọi lại kèm header `PAYMENT-SIGNATURE` (base64 JSON `PaymentPayload`).
 *   4. Server gửi payload cho facilitator: `/verify` rồi `/settle`. Facilitator mới là bên
 *      submit transaction lên Solana (và có thể trả phí với vai trò fee payer).
 *   5. Server trả 200 + header `PAYMENT-RESPONSE` (base64 JSON `SettleResponse`).
 */

export const HEADERS = {
  required: "PAYMENT-REQUIRED",
  signature: "PAYMENT-SIGNATURE",
  response: "PAYMENT-RESPONSE",
} as const;

/** CAIP-2 network id. Đây là định danh giao thức, không phải toàn bộ genesis hash. */
export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
/** USDC trên Devnet (Circle). */
export const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  /** Mint address của SPL token. */
  asset: string;
  /** Số lượng atomic units (USDC có 6 decimals: "10000" = 0.01 USDC). */
  amount: string;
  /** Ví nhận; transaction phải chuyển vào ATA của ví này. */
  payTo: string;
  maxTimeoutSeconds: number;
  /** Với Solana `exact`, facilitator ghi `feePayer` vào đây. */
  extra: Record<string, unknown>;
};

export type ResourceInfo = { url: string; description?: string; mimeType?: string };

export type PaymentRequired = {
  x402Version: 2;
  error?: string;
  resource: ResourceInfo;
  accepts: PaymentRequirements[];
};

export type PaymentPayload = {
  x402Version: 2;
  resource?: ResourceInfo;
  /** Mục client đã chọn trong `accepts`. Server phải so khớp lại, không tin client. */
  accepted: PaymentRequirements;
  /** Solana `exact`: transaction đã ký một phần, base64. */
  payload: { transaction: string };
};

export type VerifyResponse = { isValid: boolean; invalidReason?: string; payer?: string };
export type SettleResponse = {
  success: boolean;
  errorReason?: string;
  payer?: string;
  /** Signature của transaction đã settle. */
  transaction: string;
  network: string;
};

/** Cổng tới facilitator (HTTP `/verify`, `/settle`) hoặc logic self-facilitate. */
export interface FacilitatorPort {
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse>;
  settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse>;
}

export type RouteConfig = { resource: ResourceInfo; accepts: PaymentRequirements[] };

export type GateResult =
  | { status: 402; headers: Record<string, string>; body: PaymentRequired }
  | { status: 200; headers: Record<string, string>; settlement: SettleResponse }
  | { status: 502; headers: Record<string, string>; body: { error: string; retryable: true } };

// ---------- Mã hóa header ----------

export function encodeHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodeHeader<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
}

// ---------- 402 challenge ----------

export function buildPaymentRequired(route: RouteConfig, error?: string): PaymentRequired {
  if (route.accepts.length === 0) throw new Error("Route cần ít nhất một payment option");
  for (const option of route.accepts) {
    if (!/^\d+$/.test(option.amount) || BigInt(option.amount) <= 0n) throw new Error("amount phải là số nguyên dương");
    if (!option.network.startsWith("solana:")) throw new Error("network phải là CAIP-2, ví dụ solana:EtWT...");
    if (option.maxTimeoutSeconds <= 0) throw new Error("maxTimeoutSeconds phải > 0");
  }
  return { x402Version: 2, ...(error ? { error } : {}), resource: route.resource, accepts: route.accepts };
}

function paymentRequired(route: RouteConfig, error?: string): GateResult {
  const body = buildPaymentRequired(route, error);
  return { status: 402, headers: { [HEADERS.required]: encodeHeader(body) }, body };
}

// ---------- Chống settle trùng ----------

/**
 * Tài liệu x402 yêu cầu server tự settle trên Solana giữ cache ngắn hạn các transaction
 * payload và xóa sau 120 giây. Ta "claim" payload TRƯỚC khi gọi facilitator, nên nhiều
 * request đồng thời mang cùng payload chỉ có một request đi tiếp.
 */
export class SettlementCache {
  readonly #entries = new Map<string, number>();
  constructor(readonly ttlMs = 120_000) {}

  claim(transaction: string, now: number): boolean {
    for (const [key, at] of this.#entries) if (now - at > this.ttlMs) this.#entries.delete(key);
    if (this.#entries.has(transaction)) return false;
    this.#entries.set(transaction, now);
    return true;
  }

  release(transaction: string): void {
    this.#entries.delete(transaction);
  }
}

// ---------- Resource server gate ----------

const sameRequirements = (a: PaymentRequirements, b: PaymentRequirements) =>
  a.scheme === b.scheme &&
  a.network === b.network &&
  a.asset === b.asset &&
  a.amount === b.amount &&
  a.payTo === b.payTo;

export async function gate(input: {
  paymentHeader: string | undefined;
  route: RouteConfig;
  facilitator: FacilitatorPort;
  cache: SettlementCache;
  now: number;
}): Promise<GateResult> {
  const { paymentHeader, route, facilitator, cache, now } = input;

  // 1. Chưa thanh toán: trả challenge.
  if (!paymentHeader) return paymentRequired(route);

  // 2. Decode và kiểm tra hình dạng payload.
  let payment: PaymentPayload;
  try {
    payment = decodeHeader<PaymentPayload>(paymentHeader);
  } catch {
    return paymentRequired(route, "invalid_payload");
  }
  if (payment?.x402Version !== 2 || typeof payment.payload?.transaction !== "string" || !payment.accepted) {
    return paymentRequired(route, "invalid_payload");
  }

  // 3. `accepted` phải trùng một option server đã công bố. Không có bước này, client có thể
  //    tự hạ amount hoặc đổi payTo/asset rồi facilitator vẫn verify "đúng" theo payload đó.
  const requirements = route.accepts.find((option) => sameRequirements(option, payment.accepted));
  if (!requirements) return paymentRequired(route, "requirements_mismatch");

  // 4. Claim payload để chặn replay và retry đồng thời.
  const tx = payment.payload.transaction;
  if (!cache.claim(tx, now)) return paymentRequired(route, "duplicate_payment");

  try {
    // 5. Verify: chữ ký, layout instruction, amount, mint, ATA người nhận, fee payer...
    const verified = await facilitator.verify(payment, requirements);
    if (!verified.isValid) {
      cache.release(tx);
      return paymentRequired(route, verified.invalidReason ?? "invalid_payment");
    }

    // 6. Settle: facilitator submit transaction và chờ confirm.
    const settlement = await facilitator.settle(payment, requirements);
    if (!settlement.success) {
      // Giữ claim: transaction có thể đã lên chain; xử lý bằng reconcile theo signature, không cho gửi lại.
      return paymentRequired(route, settlement.errorReason ?? "settlement_failed");
    }

    return { status: 200, headers: { [HEADERS.response]: encodeHeader(settlement) }, settlement };
  } catch {
    // Facilitator/RPC lỗi mạng. Retry cùng payload là an toàn: một transaction đã ký chỉ có
    // một signature nên không thể lên chain hai lần.
    cache.release(tx);
    return { status: 502, headers: {}, body: { error: "facilitator_unavailable", retryable: true } };
  }
}
