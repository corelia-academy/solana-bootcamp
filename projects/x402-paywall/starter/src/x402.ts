/**
 * Lõi giao thức x402 v2 (scheme `exact`, Solana) viết tay để học.
 *
 * Starter: types theo spec v2 đã có. Hoàn thiện từng hàm theo thứ tự TODO.
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

export function encodeHeader(_value: unknown): string {
  throw new Error("TODO 1: JSON → base64");
}

export function decodeHeader<T>(_value: string): T {
  throw new Error("TODO 1: base64 → JSON");
}

// ---------- 402 challenge ----------

export function buildPaymentRequired(_route: RouteConfig, _error?: string): PaymentRequired {
  throw new Error("TODO 2: validate options, trả PaymentRequired v2");
}

// ---------- Chống settle trùng ----------

/**
 * Tài liệu x402 yêu cầu server tự settle trên Solana giữ cache ngắn hạn các transaction
 * payload và xóa sau 120 giây. Ta "claim" payload TRƯỚC khi gọi facilitator, nên nhiều
 * request đồng thời mang cùng payload chỉ có một request đi tiếp.
 */
export class SettlementCache {
  constructor(readonly ttlMs = 120_000) {}

  claim(_transaction: string, _now: number): boolean {
    throw new Error("TODO 4: claim payload, hết hạn sau ttlMs");
  }

  release(_transaction: string): void {
    throw new Error("TODO 4: release payload");
  }
}

// ---------- Resource server gate ----------

export async function gate(_input: {
  paymentHeader: string | undefined;
  route: RouteConfig;
  facilitator: FacilitatorPort;
  cache: SettlementCache;
  now: number;
}): Promise<GateResult> {
  throw new Error("TODO 3+5: 402 khi thiếu header, decode, so khớp accepted, claim, verify, settle");
}
