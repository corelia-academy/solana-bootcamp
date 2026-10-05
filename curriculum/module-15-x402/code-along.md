# x402 Paywall — Code-along từng bước

Bài này viết lại [x402 Paywall](../../projects/x402-paywall/README.md) từ một thư mục trống, theo đúng thứ tự video Module 15. Mỗi bước gõ một đoạn ngắn rồi chạy `pnpm run check` (type-check) hoặc `pnpm test`. Bước cuối ra đúng code `final` (chỉ khác `"name"` trong `package.json`); `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần Node 24 và pnpm 9 theo [docs/setup.md](../../docs/setup.md), wallet học tập `~/.config/solana/bootcamp-devnet.json` từ Module 1, và đã học SPL token/ATA ở Module 7.

<a id="x402-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học. Trên Windows chạy trong WSL và dùng `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs/x402-paywall
cd ~/code/bootcamp-labs/x402-paywall
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/x402-paywall`.

### 0a. package.json và phiên bản Node

**Tạo file `package.json`:**

<!-- file: package.json; mode: create -->
```json
{
  "license": "MIT",
  "name": "x402-paywall",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "typescript": "^5.7.3",
    "vitest": "^3.0.0"
  }
}
```

**Tạo file `.nvmrc`:**

<!-- file: .nvmrc; mode: create -->
```text
24
```

```bash
pnpm install
```

`"type": "module"` để dùng `import`/`export` và top-level `await`. Thư viện x402 cài ở Bước 6, khi viết server thật.

### 0b. tsconfig.json

**Tạo file `tsconfig.json`:**

<!-- file: tsconfig.json; mode: create -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "types": ["node", "vitest/globals"],
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

```bash
mkdir src tests
```

Chưa chạy `pnpm run check` ở bước này: chưa có file `.ts` nào nên `tsc` báo `TS18003: No inputs were found`.

<a id="x402-1"></a>
## Bước 1 — Định dạng dữ liệu x402 v2

**Khái niệm:** [request cycle](./lessons.md#152-request-cycle) · [payload](./lessons.md#153-payload) · [wire contract](./lessons.md#wire-contract)

Sau mỗi đoạn 1a–1g chạy `pnpm run check`: không in lỗi là được.

### 1a. Mô tả luồng ở đầu file

**Tạo file `src/x402.ts`:**

<!-- file: src/x402.ts; mode: create -->
```ts
/**
 * Lõi giao thức x402 v2 (scheme `exact`, Solana) viết tay để học.
 *
 * Bản production dùng SDK chính thức: `src/server.ts` (@x402/express) và `src/client.ts`
 * (@x402/fetch). File này làm lại đúng những bước SDK làm phía resource server để thấy
 * rõ từng kiểm tra, và test được hoàn toàn offline.
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
```

### 1b. Tên header và hằng số mạng

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
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
```

- `as const` giữ đúng chuỗi literal để TypeScript bắt lỗi gõ sai tên header.
- Network theo CAIP-2 (`solana:<genesis hash rút gọn>`); `"solana-devnet"` là kiểu v1, không dùng nữa.
- Kiểm tra mint, không tin chữ "USDC".

### 1c. PaymentRequirements

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
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
```

`amount` là atomic units dạng chuỗi: USDC có 6 decimals nên `"10000"` = 0.01 USDC.

### 1d. PaymentRequired và PaymentPayload

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
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
```

`accepted` là option **client tự khai** đã chọn; server sẽ so khớp lại ở Bước 3.

### 1e. Kết quả verify/settle và cổng facilitator

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
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
```

`FacilitatorPort` là interface: test truyền bản giả (mock), server thật dùng HTTP tới facilitator.

### 1f. Cấu hình route và kết quả gate

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
export type RouteConfig = { resource: ResourceInfo; accepts: PaymentRequirements[] };

export type GateResult =
  | { status: 402; headers: Record<string, string>; body: PaymentRequired }
  | { status: 200; headers: Record<string, string>; settlement: SettleResponse }
  | { status: 502; headers: Record<string, string>; body: { error: string; retryable: true } };
```

`GateResult` là union của ba kết quả 402 / 200 / 502; `status` cho TypeScript biết đang ở nhánh nào.

### 1g. Mã hóa header

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
// ---------- Mã hóa header ----------

export function encodeHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodeHeader<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
}
```

Header là JSON mã hóa base64. `decodeHeader<T>` là hàm generic: người gọi nói kiểu mong đợi, `as T` chỉ ép kiểu lúc compile, không kiểm tra lúc chạy.

### 1h. Test đầu tiên

**Tạo file `tests/x402.test.ts`:**

<!-- file: tests/x402.test.ts; mode: create -->
```ts
import { describe, expect, it } from "vitest";
import {
  decodeHeader,
  encodeHeader,
} from "../src/x402.js";

describe("x402 v2 header và challenge", () => {
  it("header là base64 của JSON và đọc lại ra đúng object", () => {
    const header = encodeHeader({ x402Version: 2, note: "xin chào" });
    expect(Buffer.from(header, "base64").toString("utf8")).toBe('{"x402Version":2,"note":"xin chào"}');
    expect(decodeHeader(header)).toEqual({ x402Version: 2, note: "xin chào" });
  });
});
```

```bash
pnpm test
```

Kết quả: `Tests  1 passed (1)`.

<a id="x402-2"></a>
## Bước 2 — 402 challenge

**Khái niệm:** [request cycle](./lessons.md#152-request-cycle) · [resource server](./lessons.md#155-resource-server)

### 2a. buildPaymentRequired

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
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
```

Route cấu hình sai thì ném lỗi ngay lúc tạo challenge, trước khi client nào thấy giá sai. `pnpm run check`: không lỗi.

### 2b. Fixture route trong test

Ba edit trong `tests/x402.test.ts`: thêm import, rồi thêm `payTo` + `route` dưới khối import.

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `decodeHeader,`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  SOLANA_DEVNET,
  USDC_DEVNET,
  buildPaymentRequired,
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `encodeHeader,`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
  type RouteConfig,
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `} from "../src/x402.js";`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
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
```

`pnpm run check`: không lỗi.

### 2c. Test route cấu hình sai

**Trong `tests/x402.test.ts`, chèn trước dòng `});` cuối file:**

<!-- file: tests/x402.test.ts; mode: before_last -->
```ts
  it("route cấu hình sai bị từ chối khi tạo challenge", () => {
    expect(() => buildPaymentRequired({ ...route, accepts: [] })).toThrow("ít nhất một");
    expect(() => buildPaymentRequired({ ...route, accepts: [{ ...route.accepts[0], amount: "0.01" }] })).toThrow("amount");
    expect(() => buildPaymentRequired({ ...route, accepts: [{ ...route.accepts[0], network: "solana-devnet" }] })).toThrow("CAIP-2");
  });
```

`pnpm test`: `Tests  2 passed (2)`.

### 2d. Khung gate: nhánh chưa thanh toán

**Thêm vào cuối `src/x402.ts`:**

<!-- file: src/x402.ts; mode: append -->
```ts
// ---------- Resource server gate ----------

export async function gate(input: {
  paymentHeader: string | undefined;
  route: RouteConfig;
  facilitator: FacilitatorPort;
}): Promise<GateResult> {
  const { paymentHeader, route, facilitator } = input;

  // 1. Chưa thanh toán: trả challenge.
  if (!paymentHeader) return paymentRequired(route);

  throw new Error("Chưa viết: đọc payment");
}
```

Dòng `throw new Error("Chưa viết: đọc payment")` là tạm, Bước 3a thay nó. `pnpm run check`: không lỗi.

### 2e. Facilitator giả và hàm run

**Trong `tests/x402.test.ts`, thay dòng `import { describe, expect, it } from "vitest";` bằng:**

<!-- file: tests/x402.test.ts; mode: replace -->
```ts
import { describe, expect, it, vi } from "vitest";
```

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `SOLANA_DEVNET,`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  HEADERS,
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `encodeHeader,`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
  gate,
  type FacilitatorPort,
  type PaymentRequired,
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `};` đóng khối `route`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
const facilitator = (overrides: Partial<FacilitatorPort> = {}): FacilitatorPort => ({
  verify: vi.fn().mockResolvedValue({ isValid: true, payer: "Payer" }),
  settle: vi.fn(),
  ...overrides,
});

const run = (header: string | undefined, f = facilitator()) =>
  gate({ paymentHeader: header, route, facilitator: f });
```

`vi.fn()` tạo hàm giả ghi lại số lần được gọi; `mockResolvedValue` cho nó trả Promise đã resolve. `pnpm run check`: không lỗi.

### 2f. Test request đầu tiên

**Thêm vào cuối `tests/x402.test.ts`:**

<!-- file: tests/x402.test.ts; mode: append -->
```ts
describe("x402 v2 gate", () => {
  it("request đầu tiên trả 402 + header PAYMENT-REQUIRED đúng schema", async () => {
    const result = await run(undefined);
    expect(result.status).toBe(402);
    const body = decodeHeader<PaymentRequired>(result.headers[HEADERS.required]);
    expect(body.x402Version).toBe(2);
    expect(body.accepts[0]).toMatchObject({ scheme: "exact", network: SOLANA_DEVNET, asset: USDC_DEVNET, amount: "10000" });
  });
});
```

`pnpm test`: `Tests  3 passed (3)`.

<a id="x402-3"></a>
## Bước 3 — Đọc payment và so khớp `accepted`

**Khái niệm:** [payload](./lessons.md#153-payload)

### 3a. Decode và kiểm tra hình dạng payload

**Trong `src/x402.ts`, thay dòng `throw new Error("Chưa viết: đọc payment");` bằng:**

<!-- file: src/x402.ts; mode: replace -->
```ts
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

  throw new Error("Chưa viết: so khớp accepted");
```

Header là dữ liệu từ ngoài vào: có thể không phải base64, không phải JSON, hoặc sai version. `pnpm run check`: không lỗi.

### 3b. Helper payload và test payload hỏng

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `type PaymentRequired,`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  type PaymentPayload,
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `};` đóng khối `route`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
const payload = (overrides: Partial<PaymentPayload["accepted"]> = {}, tx = "signed-tx-base64"): PaymentPayload => ({
  x402Version: 2,
  resource: route.resource,
  accepted: { ...route.accepts[0], ...overrides },
  payload: { transaction: tx },
});
```

**Trong `tests/x402.test.ts`, chèn trước dòng `});` cuối file:**

<!-- file: tests/x402.test.ts; mode: before_last -->
```ts
  it("payload hỏng hoặc sai version trả 402 invalid_payload", async () => {
    expect((await run("not-base64-json")).status).toBe(402);
    const v1 = await run(encodeHeader({ ...payload(), x402Version: 1 }));
    expect(v1.status === 402 && v1.body.error).toBe("invalid_payload");
  });
```

`pnpm test`: `Tests  4 passed (4)`.

### 3c. So khớp `accepted` với option đã công bố

**Trong `src/x402.ts`, chèn ngay sau dòng `// ---------- Resource server gate ----------`:**

<!-- file: src/x402.ts; mode: after -->
```ts
const sameRequirements = (a: PaymentRequirements, b: PaymentRequirements) =>
  a.scheme === b.scheme &&
  a.network === b.network &&
  a.asset === b.asset &&
  a.amount === b.amount &&
  a.payTo === b.payTo;
```

**Trong `src/x402.ts`, thay dòng `throw new Error("Chưa viết: so khớp accepted");` bằng:**

<!-- file: src/x402.ts; mode: replace -->
```ts
  // 3. `accepted` phải trùng một option server đã công bố. Không có bước này, client có thể
  //    tự hạ amount hoặc đổi payTo/asset rồi facilitator vẫn verify "đúng" theo payload đó.
  const requirements = route.accepts.find((option) => sameRequirements(option, payment.accepted));
  if (!requirements) return paymentRequired(route, "requirements_mismatch");

  throw new Error("Chưa viết: verify và settle");
```

Không có bước này, client tự hạ `amount` hoặc đổi `payTo` rồi facilitator vẫn verify "đúng" theo payload đó. `pnpm run check`: không lỗi.

### 3d. Test `accepted` sai

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `it("payload hỏng hoặc sai version trả 402 invalid_payload", async () => {`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
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
```

`it.each` chạy cùng một test với 4 bộ dữ liệu. `pnpm test`: `Tests  8 passed (8)`.

<a id="x402-4"></a>
## Bước 4 — Verify và settle qua facilitator

**Khái niệm:** [USDC settlement](./lessons.md#154-usdc-settlement) · [facilitator](./lessons.md#156-facilitator)

### 4a. Gọi verify rồi settle

**Trong `src/x402.ts`, thay dòng `throw new Error("Chưa viết: verify và settle");` bằng:**

<!-- file: src/x402.ts; mode: replace -->
```ts
  // 5. Verify: chữ ký, layout instruction, amount, mint, ATA người nhận, fee payer...
  const verified = await facilitator.verify(payment, requirements);
  if (!verified.isValid) {
    return paymentRequired(route, verified.invalidReason ?? "invalid_payment");
  }

  // 6. Settle: facilitator submit transaction và chờ confirm.
  const settlement = await facilitator.settle(payment, requirements);
  if (!settlement.success) {
    return paymentRequired(route, settlement.errorReason ?? "settlement_failed");
  }

  return { status: 200, headers: { [HEADERS.response]: encodeHeader(settlement) }, settlement };
```

Chỉ trả nội dung khi settle thành công. `pnpm run check`: không lỗi.

### 4b. Facilitator giả trả settle thành công, test payment hợp lệ

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `type RouteConfig,`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
  type SettleResponse,
```

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `const facilitator = (overrides: Partial<FacilitatorPort> = {}): FacilitatorPort => ({`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
const settled: SettleResponse = { success: true, transaction: "5sig", network: SOLANA_DEVNET, payer: "Payer" };
```

**Trong `tests/x402.test.ts`, thay dòng `settle: vi.fn(),` bằng:**

<!-- file: tests/x402.test.ts; mode: replace -->
```ts
  settle: vi.fn().mockResolvedValue(settled),
```

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `it.each([`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  it("payment hợp lệ: verify → settle → 200 + PAYMENT-RESPONSE", async () => {
    const f = facilitator();
    const result = await run(encodeHeader(payload()), f);
    expect(result.status).toBe(200);
    expect(decodeHeader<SettleResponse>(result.headers[HEADERS.response]).transaction).toBe("5sig");
    expect(f.verify).toHaveBeenCalledOnce();
    expect(f.settle).toHaveBeenCalledOnce();
  });
```

`pnpm test`: `Tests  9 passed (9)`.

### 4c. Test verify thất bại

**Trong `tests/x402.test.ts`, chèn trước dòng `});` cuối file:**

<!-- file: tests/x402.test.ts; mode: before_last -->
```ts
  it("verify thất bại trả 402 với lý do của facilitator, không settle", async () => {
    const f = facilitator({ verify: vi.fn().mockResolvedValue({ isValid: false, invalidReason: "insufficient_funds" }) });
    const result = await run(encodeHeader(payload()), f);
    expect(result.status === 402 && result.body.error).toBe("insufficient_funds");
    expect(f.settle).not.toHaveBeenCalled();
  });
```

`pnpm test`: `Tests  10 passed (10)`.

<a id="x402-5"></a>
## Bước 5 — Replay, request đồng thời và timeout

**Khái niệm:** [replay và đồng thời](./lessons.md#158-replay-và-đồng-thời) · [failure/security](./lessons.md#1511-failuresecurity)

### 5a. SettlementCache.claim

**Trong `src/x402.ts`, chèn ngay trước dòng `// ---------- Resource server gate ----------`:**

<!-- file: src/x402.ts; mode: before -->
```ts
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
}
```

`#entries` là field private của class; mỗi lần claim dọn các mục quá `ttlMs`. `pnpm run check`: không lỗi.

### 5b. release và test TTL

**Trong `src/x402.ts`, chèn ngay trước dấu `}` đóng class `SettlementCache`:**

<!-- file: src/x402.ts; mode: before -->
```ts
  release(transaction: string): void {
    this.#entries.delete(transaction);
  }
```

**Trong `tests/x402.test.ts`, chèn ngay sau dòng `SOLANA_DEVNET,`:**

<!-- file: tests/x402.test.ts; mode: after -->
```ts
  SettlementCache,
```

**Trong `tests/x402.test.ts`, chèn trước dòng `});` cuối file:**

<!-- file: tests/x402.test.ts; mode: before_last -->
```ts
  it("cache hết hạn sau TTL", () => {
    const cache = new SettlementCache(120_000);
    expect(cache.claim("tx", 0)).toBe(true);
    expect(cache.claim("tx", 60_000)).toBe(false);
    expect(cache.claim("tx", 120_001)).toBe(true);
  });
```

`pnpm test`: `Tests  11 passed (11)`.

### 5c. Gate nhận cache và thời điểm hiện tại

**Trong `src/x402.ts`, chèn ngay sau dòng `facilitator: FacilitatorPort;`:**

<!-- file: src/x402.ts; mode: after -->
```ts
  cache: SettlementCache;
  now: number;
```

**Trong `src/x402.ts`, thay dòng `const { paymentHeader, route, facilitator } = input;` bằng:**

<!-- file: src/x402.ts; mode: replace -->
```ts
  const { paymentHeader, route, facilitator, cache, now } = input;
```

**Trong `tests/x402.test.ts`, thay 2 dòng liền nhau `const run = (header: string | undefined, f = facilitator()) =>` · `gate({ paymentHeader: header, route, facilitator: f });` bằng:**

<!-- file: tests/x402.test.ts; mode: replace -->
```ts
const run = (header: string | undefined, f = facilitator(), cache = new SettlementCache(), now = 0) =>
  gate({ paymentHeader: header, route, facilitator: f, cache, now });
```

`now` truyền từ ngoài vào để test điều khiển được thời gian. `pnpm test`: vẫn `Tests  11 passed (11)`.

### 5d. Test replay (đỏ trước)

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `it("cache hết hạn sau TTL", () => {`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  it("cùng transaction gửi lại bị chặn (replay)", async () => {
    const cache = new SettlementCache();
    expect((await run(encodeHeader(payload()), facilitator(), cache)).status).toBe(200);
    const replay = await run(encodeHeader(payload()), facilitator(), cache, 1_000);
    expect(replay.status === 402 && replay.body.error).toBe("duplicate_payment");
  });
```

`pnpm test`: `Tests  1 failed | 11 passed (12)`, test replay báo:

```text
AssertionError: expected false to be 'duplicate_payment'
```

Gate hiện cho cùng một payment đi qua hai lần.

### 5e. Claim payload trước khi gọi facilitator

**Trong `src/x402.ts`, chèn ngay trước dòng `// 5. Verify: chữ ký, layout instruction, amount, mint, ATA người nhận, fee payer...`:**

<!-- file: src/x402.ts; mode: before -->
```ts
  // 4. Claim payload để chặn replay và retry đồng thời.
  const tx = payment.payload.transaction;
  if (!cache.claim(tx, now)) return paymentRequired(route, "duplicate_payment");
```

**Trong `src/x402.ts`, chèn ngay sau dòng `if (!verified.isValid) {`:**

<!-- file: src/x402.ts; mode: after -->
```ts
    cache.release(tx);
```

**Trong `src/x402.ts`, chèn ngay trước dòng `return paymentRequired(route, settlement.errorReason ?? "settlement_failed");`:**

<!-- file: src/x402.ts; mode: before -->
```ts
    // Giữ claim: transaction có thể đã lên chain; xử lý bằng reconcile theo signature, không cho gửi lại.
```

Verify fail thì nhả claim (payment chưa đi đâu); settle đã có kết quả thì giữ claim. `pnpm test`: `Tests  12 passed (12)`.

### 5f. Test request đồng thời

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `it("cache hết hạn sau TTL", () => {`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  it("request đồng thời cùng payload chỉ settle một lần", async () => {
    const f = facilitator();
    const cache = new SettlementCache();
    const header = encodeHeader(payload());
    const results = await Promise.all([run(header, f, cache), run(header, f, cache), run(header, f, cache)]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(f.settle).toHaveBeenCalledOnce();
  });
```

`claim` chạy đồng bộ trước `await` đầu tiên, nên ba request cùng payload chỉ một request qua được. `pnpm test`: `Tests  13 passed (13)`.

### 5g. Test facilitator timeout (đỏ trước)

**Trong `tests/x402.test.ts`, chèn ngay trước dòng `it("cache hết hạn sau TTL", () => {`:**

<!-- file: tests/x402.test.ts; mode: before -->
```ts
  it("facilitator timeout trả 502 retryable và cho phép retry cùng payload", async () => {
    const cache = new SettlementCache();
    const down = facilitator({ verify: vi.fn().mockRejectedValue(new Error("timeout")) });
    const first = await run(encodeHeader(payload()), down, cache);
    expect(first).toMatchObject({ status: 502, body: { retryable: true } });
    expect((await run(encodeHeader(payload()), facilitator(), cache)).status).toBe(200);
  });
```

`pnpm test`: `Tests  1 failed | 13 passed (14)`, test timeout báo `Error: timeout`: lỗi mạng của facilitator làm gate ném lỗi ra ngoài.

### 5h. Bọc verify/settle bằng try/catch

Trong `src/x402.ts`, thêm `try {` trước dòng `// 5. Verify…`, thụt các dòng từ `// 5. Verify…` đến `return { status: 200, … }` vào một mức (2 dấu cách), rồi thêm khối `catch` sau dòng return 200. Phần cuối hàm `gate` sau khi sửa:

**Kết quả phần cuối `gate` trong `src/x402.ts`:**

<!-- file: src/x402.ts; mode: replace -->
```ts
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
```

`pnpm test`: `Tests  14 passed (14)`. `src/x402.ts` và `tests/x402.test.ts` giờ giống `final`.

<a id="x402-6"></a>
## Bước 6 — Resource server thật với `@x402/express`

**Khái niệm:** [resource server](./lessons.md#155-resource-server) · [facilitator](./lessons.md#156-facilitator)

### 6a. Thêm SDK x402 và script chạy

**Trong `package.json`, thay 2 dòng liền nhau `"test": "vitest run"` · `},` bằng:**

<!-- file: package.json; mode: replace -->
```json
    "test": "vitest run",
    "start:server": "tsx src/server.ts",
    "start:client": "tsx src/client.ts"
  },
  "dependencies": {
    "@solana/kit": "5.5.1",
    "@x402/core": "2.28.0",
    "@x402/express": "2.28.0",
    "@x402/fetch": "2.28.0",
    "@x402/svm": "2.28.0",
    "express": "5.1.0"
  },
```

**Trong `package.json`, chèn ngay trước dòng `"@types/node": "^22.10.0",`:**

<!-- file: package.json; mode: before -->
```json
    "@types/express": "^5.0.0",
```

**Trong `package.json`, chèn ngay sau dòng `"@types/node": "^22.10.0",`:**

<!-- file: package.json; mode: after -->
```json
    "tsx": "^4.19.0",
```

```bash
pnpm install
```

### 6b. server.ts: mô tả và import

**Tạo file `src/server.ts`:**

<!-- file: src/server.ts; mode: create -->
```ts
/**
 * Resource server thật, dùng SDK x402 v2 chính thức trên Solana Devnet.
 *
 * Chạy:
 *   PAY_TO=<ví Devnet nhận USDC> pnpm start:server
 *
 * Middleware làm đúng các bước như `gate()` trong src/x402.ts: trả 402 + PAYMENT-REQUIRED,
 * đọc PAYMENT-SIGNATURE, gọi facilitator /verify và /settle, gắn PAYMENT-RESPONSE.
 * Ví PAY_TO phải có sẵn USDC ATA: facilitator trả phí giao dịch nhưng không tạo ATA người nhận.
 */
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET } from "./x402.js";
```

`pnpm run check`: không lỗi.

### 6c. Cấu hình từ biến môi trường và facilitator

**Thêm vào cuối `src/server.ts`:**

<!-- file: src/server.ts; mode: append -->
```ts
const payTo = process.env.PAY_TO;
if (!payTo) throw new Error("Thiếu PAY_TO (địa chỉ ví Devnet nhận thanh toán)");
const port = Number(process.env.PORT ?? 4021);
const facilitatorUrl = process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitator).register(SOLANA_DEVNET, new ExactSvmScheme());
```

`pnpm run check`: không lỗi.

### 6d. Middleware trả phí cho `GET /data`

**Thêm vào cuối `src/server.ts`:**

<!-- file: src/server.ts; mode: append -->
```ts
const app = express();
app.use(
  paymentMiddleware(
    {
      "GET /data": {
        accepts: [{ scheme: "exact", price: "$0.01", network: SOLANA_DEVNET, payTo }],
        description: "Bootcamp premium data",
        mimeType: "application/json",
      },
    },
    resourceServer,
  ),
);
```

`pnpm run check`: không lỗi.

### 6e. Route và listen

**Thêm vào cuối `src/server.ts`:**

<!-- file: src/server.ts; mode: append -->
```ts
app.get("/data", (_req, res) => {
  res.json({ lesson: "x402", tip: "Payment chỉ được chấp nhận sau khi facilitator settle thành công." });
});

app.listen(port, () => console.log(`x402 server: http://localhost:${port}/data (facilitator ${facilitatorUrl})`));
```

Chạy server với ví học tập làm ví nhận (terminal 1):

```bash
PAY_TO=$(solana address) pnpm start:server
```

Kết quả: `x402 server: http://localhost:4021/data (facilitator https://x402.org/facilitator)`.

Gọi thử ở terminal 2, chưa trả tiền:

```bash
curl -si http://localhost:4021/data | head -4
curl -si http://localhost:4021/data | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r' | base64 --decode
```

Kết quả: `HTTP/1.1 402 Payment Required`, rồi JSON `PaymentRequired` có `"x402Version":2`, `"amount":"10000"`, `"asset":"4zMMC9…"`, `"payTo"` là ví của bạn và `"extra":{"feePayer":"…"}` do facilitator điền.

<a id="x402-7"></a>
## Bước 7 — Paying client với `@x402/fetch` trên Devnet

**Khái niệm:** [paying client](./lessons.md#157-paying-client) · [USDC settlement](./lessons.md#154-usdc-settlement)

Chuẩn bị ví (chỉ Devnet, không dùng ví chính):

```bash
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --url devnet
solana-keygen new --no-bip39-passphrase --outfile ~/.config/solana/devnet-payer.json
solana address --keypair ~/.config/solana/devnet-payer.json
```

- Lệnh đầu tạo USDC ATA cho ví học tập (ví nhận `PAY_TO`); facilitator không tạo ATA người nhận. Ví học tập cần một ít Devnet SOL để trả rent.
- Ví payer không cần SOL vì facilitator là fee payer. Nạp USDC Devnet cho địa chỉ payer ở [faucet.circle.com](https://faucet.circle.com) (chọn Solana Devnet).

### 7a. client.ts: mô tả và import

**Tạo file `src/client.ts`:**

<!-- file: src/client.ts; mode: create -->
```ts
/**
 * Paying client thật, dùng SDK x402 v2 chính thức.
 *
 * Chạy:
 *   PAYER_KEYPAIR=~/.config/solana/devnet-payer.json pnpm start:client
 *
 * Ví payer cần USDC Devnet (faucet: https://faucet.circle.com). KHÔNG dùng ví chính:
 * tạo ví riêng, nạp số dư nhỏ. `wrapFetchWithPayment` tự xử lý 402 → ký → gọi lại.
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { SOLANA_DEVNET } from "./x402.js";
```

`pnpm run check`: không lỗi.

### 7b. Ký và gọi lại tự động

**Thêm vào cuối `src/client.ts`:**

<!-- file: src/client.ts; mode: append -->
```ts
const keypairPath = (process.env.PAYER_KEYPAIR ?? "").replace(/^~/, homedir());
if (!keypairPath) throw new Error("Thiếu PAYER_KEYPAIR (đường dẫn keypair JSON của ví Devnet riêng)");
const url = process.env.RESOURCE_URL ?? "http://localhost:4021/data";

const secret = Uint8Array.from(JSON.parse(await readFile(keypairPath, "utf8")) as number[]);
const signer = toClientSvmSigner(await createKeyPairSignerFromBytes(secret));

const client = registerExactSvmScheme(new x402Client(), { signer, networks: [SOLANA_DEVNET] });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment(url);
console.log("status", response.status);
console.log("PAYMENT-RESPONSE", response.headers.get("PAYMENT-RESPONSE"));
console.log(await response.json());
```

Server vẫn chạy ở terminal 1. Ở terminal 2:

```bash
PAYER_KEYPAIR=~/.config/solana/devnet-payer.json pnpm start:client
```

Kết quả mong đợi: `status 200`, dòng `PAYMENT-RESPONSE` là một chuỗi base64, rồi JSON `{ lesson: 'x402', tip: '…' }`. Decode `PAYMENT-RESPONSE` để lấy signature trong `transaction` và mở trên [Explorer Devnet](https://explorer.solana.com/?cluster=devnet): một lệnh `transferChecked` 0.01 USDC từ payer vào ATA của ví học tập, fee payer là địa chỉ facilitator.

Kiểm tra cuối:

```bash
pnpm run check
pnpm test
```

Cần `Tests  14 passed (14)`. Project giờ giống `projects/x402-paywall/final` (chỉ khác `"name"` trong `package.json`).
