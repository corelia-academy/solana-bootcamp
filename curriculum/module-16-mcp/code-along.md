# MCP Solana Server — Code-along từng bước

Bài này viết lại [MCP Solana Server](../../projects/mcp-solana-server/README.md) từ một thư mục trống, theo đúng thứ tự video Module 16. Mỗi bước gõ một đoạn ngắn rồi type-check hoặc test ngay. Bước cuối ra đúng `src/` và `tests/` của bản `final`; `starter`, `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần Node.js 24 và pnpm 9 theo [docs/setup.md](../../docs/setup.md). Module này không cần Rust, Anchor hay ví Devnet: mọi RPC đều là mock.

<a id="mcp-0"></a>
## Bước 0 — Tạo project

Tạo project ngoài repo khóa học. Trên Windows dùng filesystem của WSL như `~/code`, không dùng `/mnt/c`.

```bash
mkdir -p ~/code/bootcamp-labs/mcp-solana-server
cd ~/code/bootcamp-labs/mcp-solana-server
echo "24" > .nvmrc
mkdir src tests
```

Mọi lệnh còn lại chạy tại `~/code/bootcamp-labs/mcp-solana-server`.

**Tạo `package.json`:**

<!-- file: package.json; mode: replace -->
```json
{
  "name": "mcp-solana-server",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "test": "vitest run",
    "start": "tsx src/server.ts"
  }
}
```

Cài thư viện. SDK được khóa đúng `1.29.0`; các thư viện còn lại theo cùng range với `final`:

```bash
pnpm add --save-exact @modelcontextprotocol/sdk@1.29.0
pnpm add "zod@^3.25.0"
pnpm add -D "typescript@^5.7.3" "tsx@^4.19.0" "vitest@^3.0.0" "@types/node@^22.10.0"
```

**Tạo `tsconfig.json`** (cùng nội dung với `final/tsconfig.json`, chỉ khác xuống dòng):

<!-- file: tsconfig.json; mode: replace -->
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

Chạy `pnpm exec tsc --version`: in `Version 5.9.3` (hoặc bản 5.x mới hơn). Chưa chạy `pnpm run check` ở bước này: `src` còn trống nên `tsc` báo `No inputs were found`.

<a id="mcp-1"></a>
## Bước 1 — Kiểu kết quả và cổng RPC

**Khái niệm:** [tool schema và structured output](./lessons.md#163-tool-schema) · [mock/local mode](./lessons.md#mocklocal-mode)

### 1a. Mã lỗi và `ToolResult`

**Tạo `src/core.ts`:**

<!-- file: src/core.ts; mode: replace -->
```ts
export type ToolErrorCode =
  | "INVALID_INPUT"
  | "RPC_TIMEOUT"
  | "UNAUTHORIZED"
  | "LIMIT_EXCEEDED"
  | "NOT_ALLOWED"
  | "SIMULATION_FAILED"
  | "CONFIRMATION_FAILED";

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ToolErrorCode; message: string; retryable: boolean } };
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

- Mỗi tool trả về đúng một trong hai dạng: `ok: true` kèm `data`, hoặc `ok: false` kèm `error`. Model đọc field, không phải parse log.
- `retryable` cho model biết thử lại có ích không: RPC timeout thì có, vượt allowlist thì không.

### 1b. `RpcPort`

**Thêm vào cuối `src/core.ts`:**

<!-- file: src/core.ts; mode: append -->
```ts

export type TokenHolding = { mint: string; amount: string };

export interface RpcPort {
  balance(address: string): Promise<number>;
  tokenHoldings(address: string, limit: number): Promise<TokenHolding[]>;
  simulate(input: { program: string; instruction: string }): Promise<boolean>;
  sendSol(recipient: string, lamports: number, idempotencyKey: string): Promise<string>;
  confirm(signature: string): Promise<void>;
}
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

`RpcPort` là mọi thứ server cần từ Solana. Core chỉ biết interface này; test truyền bản mock, server thật có thể truyền bản gọi Devnet.

<a id="mcp-2"></a>
## Bước 2 — Read tools

**Khái niệm:** [balance tool](./lessons.md#164-balance-tool) · [holdings tool](./lessons.md#165-holdings-tool)

### 2a. Kiểm tra public key và tạo lỗi

**Thêm vào cuối `src/core.ts`:**

<!-- file: src/core.ts; mode: append -->
```ts

const validKey = (key: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key);

const failure = (code: ToolErrorCode, message: string, retryable = false): ToolResult<never> => ({
  ok: false,
  error: { code, message, retryable },
});
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

`validKey` chỉ nhận chuỗi base58 dài 32–44 ký tự, đúng dạng public key Solana. `failure` gom cách tạo lỗi về một chỗ để mọi tool trả cùng một hình dạng.

### 2b. `getAccountBalance`

**Thêm vào cuối `src/core.ts`:**

<!-- file: src/core.ts; mode: append -->
```ts

export class SolanaTools {
  constructor(readonly rpc: RpcPort) {}

  async getAccountBalance(address: string): Promise<ToolResult<{ lamports: number }>> {
    if (!validKey(address)) return failure("INVALID_INPUT", "Public key không hợp lệ");
    try {
      return { ok: true, data: { lamports: await this.rpc.balance(address) } };
    } catch {
      return failure("RPC_TIMEOUT", "RPC timeout", true);
    }
  }
}
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

Validate trước, gọi RPC sau. Lỗi RPC không ném ra ngoài mà đổi thành `RPC_TIMEOUT` với `retryable: true`.

### 2c. `getTokenHoldings`

**Chèn vào cuối class `SolanaTools`**, ngay trên dấu `}` cuối file, cách một dòng trống:

<!-- file: src/core.ts; mode: before-last: } -->
```ts

  async getTokenHoldings(address: string, limit = 20): Promise<ToolResult<{ items: TokenHolding[] }>> {
    if (!validKey(address) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return failure("INVALID_INPUT", "address/limit không hợp lệ");
    }
    try {
      const items = await this.rpc.tokenHoldings(address, limit);
      return { ok: true, data: { items: items.slice(0, limit) } };
    } catch {
      return failure("RPC_TIMEOUT", "RPC timeout", true);
    }
  }
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

`limit` mặc định 20, tối đa 100. `slice(0, limit)` cắt thêm một lần ở server, phòng khi RPC trả nhiều hơn số đã xin.

### 2d. Mock RPC cho test

**Tạo `tests/core.test.ts`:**

<!-- file: tests/core.test.ts; mode: replace -->
```ts
import { describe, expect, it, vi } from "vitest";
import { SolanaTools, type RpcPort } from "../src/core.js";

const key = "11111111111111111111111111111111";

const rpc = (overrides: Partial<RpcPort> = {}): RpcPort => ({
  balance: vi.fn().mockResolvedValue(5),
  tokenHoldings: vi.fn().mockResolvedValue([{ mint: key, amount: "1" }]),
  simulate: vi.fn().mockResolvedValue(true),
  sendSol: vi.fn().mockResolvedValue("sig"),
  confirm: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const make = (r = rpc()) => new SolanaTools(r);
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

`rpc()` tạo một mock đủ năm hàm; `overrides` thay riêng hàm cần thử, ví dụ cho `balance` ném lỗi.

### 2e. Hai test cho read tools

**Thêm vào cuối `tests/core.test.ts`:**

<!-- file: tests/core.test.ts; mode: append -->
```ts

describe("Solana MCP tools", () => {
  it("validate key và bound holdings", async () => {
    expect((await make().getAccountBalance("bad")).ok).toBe(false);
    expect((await make().getTokenHoldings(key, 101)).ok).toBe(false);
  });

  it("RPC error structured/retryable", async () => {
    const tools = make(rpc({ balance: vi.fn().mockRejectedValue(new Error()) }));
    expect(await tools.getAccountBalance(key)).toMatchObject({
      ok: false,
      error: { code: "RPC_TIMEOUT", retryable: true },
    });
  });
});
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `2 passed`.

<a id="mcp-3"></a>
## Bước 3 — Write tools có quyền ghi phía server

**Khái niệm:** [`send_sol`](./lessons.md#166-send_sol) · [`call_program`](./lessons.md#167-call_program) · [authentication](./lessons.md#1610-authentication) · [policy pipeline](./lessons.md#policy-pipeline)

### 3a. `AuthPort` và `Policy`

**Trong `src/core.ts`, chèn ngay trên dòng `const validKey`**, để một dòng trống sau:

<!-- file: src/core.ts; mode: before: const validKey = (key: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key); -->
```ts
/**
 * Quyền ghi do SERVER quyết định (config của host, session, approval của người dùng),
 * không bao giờ là tham số của tool. Nếu `authorized` nằm trong inputSchema,
 * model có thể tự điền `true` và bỏ qua toàn bộ guardrail.
 */
export interface AuthPort {
  canWrite(tool: "send_sol" | "call_program"): boolean;
}

export type Policy = {
  allowedRecipients: Set<string>;
  allowedPrograms: Set<string>;
  maxLamportsPerAction: number;
};

```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

### 3b. Constructor nhận policy và auth

**Trong `src/core.ts`, thay dòng** `  constructor(readonly rpc: RpcPort) {}` **bằng:**

<!-- file: src/core.ts; mode: replace-line:   constructor(readonly rpc: RpcPort) {} -->
```ts
  constructor(
    readonly rpc: RpcPort,
    readonly policy: Policy,
    readonly auth: AuthPort,
  ) {}
```

**Trong `tests/core.test.ts`, thay dòng import thứ hai bằng:**

<!-- file: tests/core.test.ts; mode: replace-line: import { SolanaTools, type RpcPort } from "../src/core.js"; -->
```ts
import { SolanaTools, type AuthPort, type RpcPort } from "../src/core.js";
```

**Rồi thay dòng** `const make = (r = rpc()) => new SolanaTools(r);` **bằng:**

<!-- file: tests/core.test.ts; mode: replace-line: const make = (r = rpc()) => new SolanaTools(r); -->
```ts
const writeOn: AuthPort = { canWrite: () => true };
const writeOff: AuthPort = { canWrite: () => false };

const make = (r = rpc(), auth: AuthPort = writeOn) =>
  new SolanaTools(r, { allowedRecipients: new Set([key]), allowedPrograms: new Set([key]), maxLamportsPerAction: 100 }, auth);
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: vẫn `2 passed`.

Policy của test chỉ cho gửi tới `key`, tối đa 100 lamports mỗi lần. `writeOn`/`writeOff` đóng vai cấu hình của server, không phải input của tool.

### 3c. `sendSol`: quyền ghi và validate

**Chèn vào cuối class `SolanaTools`**, ngay trên dấu `}` cuối file, cách một dòng trống:

<!-- file: src/core.ts; mode: before-last: } -->
```ts

  async sendSol(input: {
    recipient: string;
    lamports: number;
    idempotencyKey: string;
  }): Promise<ToolResult<{ signature: string }>> {
    // 1. Quyền ghi đến từ server, kiểm tra trước mọi thứ khác.
    if (!this.auth.canWrite("send_sol")) return failure("UNAUTHORIZED", "Server chưa bật quyền ghi");
    // 2. Validate input.
    if (
      !validKey(input.recipient) ||
      !input.idempotencyKey ||
      !Number.isSafeInteger(input.lamports) ||
      input.lamports <= 0
    ) {
      return failure("INVALID_INPUT", "Write input không hợp lệ");
    }
    return failure("NOT_ALLOWED", "Chưa có policy");
  }
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi. Dòng `return failure("NOT_ALLOWED", "Chưa có policy");` là dòng tạm, bước 3e thay nó.

### 3d. Test: `authorized: true` trong input không có tác dụng

**Chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/core.test.ts; mode: before-last: }); -->
```ts

  it("quyền ghi do server quyết định, không đọc từ tool input", async () => {
    const r = rpc();
    // Dù caller cố nhét `authorized: true`, server tắt quyền ghi thì vẫn bị chặn và RPC không được gọi.
    const input = { recipient: key, lamports: 1, idempotencyKey: "a", authorized: true } as never;
    expect(await make(r, writeOff).sendSol(input)).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    expect(r.sendSol).not.toHaveBeenCalled();
  });
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `3 passed`.

### 3e. `sendSol`: policy, gửi và confirm

**Trong `src/core.ts`, thay dòng tạm** `    return failure("NOT_ALLOWED", "Chưa có policy");` **bằng:**

<!-- file: src/core.ts; mode: replace-line:     return failure("NOT_ALLOWED", "Chưa có policy"); -->
```ts
    // 3. Policy: allowlist rồi spending cap.
    if (!this.policy.allowedRecipients.has(input.recipient)) {
      return failure("NOT_ALLOWED", "Recipient không nằm trong allowlist");
    }
    if (input.lamports > this.policy.maxLamportsPerAction) {
      return failure("LIMIT_EXCEEDED", "Vượt spending cap");
    }
    // 4. Gửi và chờ confirm.
    try {
      const signature = await this.rpc.sendSol(input.recipient, input.lamports, input.idempotencyKey);
      await this.rpc.confirm(signature);
      return { ok: true, data: { signature } };
    } catch {
      return failure("CONFIRMATION_FAILED", "Send/confirm thất bại", true);
    }
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: vẫn `3 passed`.

### 3f. Test allowlist, cap và gửi thành công

**Trong `tests/core.test.ts`, chèn ngay dưới dòng** `const key = "11111111111111111111111111111111";`:

<!-- file: tests/core.test.ts; mode: after: const key = "11111111111111111111111111111111"; -->
```ts
const other = "Vote111111111111111111111111111111111111111";
```

**Rồi chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/core.test.ts; mode: before-last: }); -->
```ts

  it("deny recipient và cap", async () => {
    expect(await make().sendSol({ recipient: other, lamports: 1, idempotencyKey: "a" })).toMatchObject({
      error: { code: "NOT_ALLOWED" },
    });
    expect(await make().sendSol({ recipient: key, lamports: 101, idempotencyKey: "a" })).toMatchObject({
      error: { code: "LIMIT_EXCEEDED" },
    });
  });

  it("send và confirm success", async () => {
    expect(await make().sendSol({ recipient: key, lamports: 10, idempotencyKey: "a" })).toEqual({
      ok: true,
      data: { signature: "sig" },
    });
  });
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `5 passed`.

### 3g. `callProgram`

**Chèn vào cuối class `SolanaTools`**, ngay trên dấu `}` cuối file, cách một dòng trống:

<!-- file: src/core.ts; mode: before-last: } -->
```ts

  async callProgram(input: { program: string; instruction: string }): Promise<ToolResult<{ simulated: true }>> {
    if (!this.auth.canWrite("call_program")) return failure("UNAUTHORIZED", "Server chưa bật quyền ghi");
    if (!validKey(input.program) || !input.instruction) {
      return failure("INVALID_INPUT", "Program call không hợp lệ");
    }
    if (!this.policy.allowedPrograms.has(input.program)) {
      return failure("NOT_ALLOWED", "Program không nằm trong allowlist");
    }
    try {
      if (!(await this.rpc.simulate(input))) return failure("SIMULATION_FAILED", "Simulation thất bại");
      return { ok: true, data: { simulated: true } };
    } catch {
      return failure("RPC_TIMEOUT", "RPC timeout", true);
    }
  }
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi. `src/core.ts` giờ giống `final/src/core.ts`.

`callProgram` không nhận raw transaction: chỉ program đã allowlist, và bản này dừng ở simulation.

### 3h. Test `callProgram` cần quyền ghi

**Chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/core.test.ts; mode: before-last: }); -->
```ts

  it("program write cần quyền ghi phía server", async () => {
    expect(await make(rpc(), writeOff).callProgram({ program: key, instruction: "vote" })).toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });
```

<!-- check: pnpm test -->
Chạy `pnpm test`: `6 passed`.

### 3i. Test allowlist, simulation và success

**Chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/core.test.ts; mode: before-last: }); -->
```ts

  it("program allowlist, simulation và success", async () => {
    expect(await make().callProgram({ program: other, instruction: "vote" })).toMatchObject({
      error: { code: "NOT_ALLOWED" },
    });
    expect(
      await make(rpc({ simulate: vi.fn().mockResolvedValue(false) })).callProgram({ program: key, instruction: "vote" }),
    ).toMatchObject({ error: { code: "SIMULATION_FAILED" } });
    expect(await make().callProgram({ program: key, instruction: "vote" })).toEqual({
      ok: true,
      data: { simulated: true },
    });
  });
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `7 passed`. `tests/core.test.ts` giờ giống `final/tests/core.test.ts`.

<a id="mcp-4"></a>
## Bước 4 — MCP server qua stdio

**Khái niệm:** [MCP primitives](./lessons.md#161-mcp-primitives) · [transport](./lessons.md#162-transport) · [tool schema](./lessons.md#163-tool-schema)

### 4a. Import và mock RPC

**Tạo `src/server.ts`:**

<!-- file: src/server.ts; mode: replace -->
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SolanaTools, type AuthPort, type RpcPort } from "./core.js";

const demoKey = "11111111111111111111111111111111";
const mockRpc: RpcPort = {
  balance: async () => 1_000_000_000,
  tokenHoldings: async () => [],
  simulate: async () => true,
  sendSol: async (_recipient, _lamports, key) => `mock-${key}`,
  confirm: async () => {},
};
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

### 4b. Quyền ghi từ biến môi trường và policy demo

**Thêm vào cuối `src/server.ts`**, ngay dòng dưới `};`, không cách dòng:

<!-- file: src/server.ts; mode: append -->
```ts
// Quyền ghi là config của server do người chạy host (Claude Desktop, IDE...) bật,
// không phải tham số tool mà model có thể tự điền.
// Ví dụ: SOLANA_MCP_WRITE_ENABLED=true pnpm start
const writeEnabled = process.env.SOLANA_MCP_WRITE_ENABLED === "true";
const auth: AuthPort = { canWrite: () => writeEnabled };
const tools = new SolanaTools(
  mockRpc,
  {
    allowedRecipients: new Set([demoKey]),
    allowedPrograms: new Set([demoKey]),
    maxLamportsPerAction: 10_000_000,
  },
  auth,
);
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

### 4c. Server, tool đầu tiên và stdio

**Thêm vào cuối `src/server.ts`**, ngay dòng dưới `);`, không cách dòng:

<!-- file: src/server.ts; mode: append -->
```ts
const server = new McpServer({ name: "solana-bootcamp", version: "1.0.0" });
const output = (result: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(result) }],
  structuredContent: { result },
});

server.registerTool(
  "get_account_balance",
  { description: "Đọc SOL balance", inputSchema: { address: z.string() } },
  async ({ address }) => output(await tools.getAccountBalance(address)),
);
await server.connect(new StdioServerTransport());
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

Thử bằng MCP Inspector (mở giao diện web, bấm Connect, vào tab Tools):

```bash
npx -y @modelcontextprotocol/inspector@2.11.0 pnpm --silent start
```

Dùng `pnpm --silent start` thay cho `pnpm start` khi một client đọc stdout: không có `--silent`, pnpm in hai dòng `> mcp-solana-server@ start ...` ra stdout, chen vào luồng JSON-RPC.

### 4d. `get_token_holdings`

**Trong `src/server.ts`, chèn ngay trên dòng** `await server.connect(new StdioServerTransport());`, không cách dòng:

<!-- file: src/server.ts; mode: before: await server.connect(new StdioServerTransport()); -->
```ts
server.registerTool(
  "get_token_holdings",
  {
    description: "Đọc token holdings có giới hạn",
    inputSchema: {
      address: z.string(),
      limit: z.number().int().min(1).max(100).optional(),
    },
  },
  async ({ address, limit }) =>
    output(await tools.getTokenHoldings(address, limit)),
);
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

### 4e. `send_sol`

**Chèn ngay trên dòng** `await server.connect(new StdioServerTransport());`, không cách dòng:

<!-- file: src/server.ts; mode: before: await server.connect(new StdioServerTransport()); -->
```ts
server.registerTool(
  "send_sol",
  {
    description: "Gửi SOL trong mock mode. Chỉ chạy khi server bật quyền ghi; có allowlist và cap",
    inputSchema: {
      recipient: z.string(),
      lamports: z.number().int().positive(),
      idempotencyKey: z.string().min(1),
    },
  },
  async (input) => output(await tools.sendSol(input)),
);
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

### 4f. `call_program`

**Chèn ngay trên dòng** `await server.connect(new StdioServerTransport());`, không cách dòng:

<!-- file: src/server.ts; mode: before: await server.connect(new StdioServerTransport()); -->
```ts
server.registerTool(
  "call_program",
  {
    description: "Mô phỏng program instruction sau policy gate. Chỉ chạy khi server bật quyền ghi",
    inputSchema: {
      program: z.string(),
      instruction: z.string().min(1),
    },
  },
  async (input) => output(await tools.callProgram(input)),
);
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi. `src/server.ts` giờ giống `final/src/server.ts`.

### 4g. Thử quyền ghi bằng Inspector

Chạy Inspector lần lượt với quyền ghi tắt và bật:

```bash
npx -y @modelcontextprotocol/inspector@2.11.0 pnpm --silent start
npx -y @modelcontextprotocol/inspector@2.11.0 -e SOLANA_MCP_WRITE_ENABLED=true pnpm --silent start
```

Quyền ghi tắt: `send_sol` trả `UNAUTHORIZED`, kể cả khi thêm `authorized: true` vào input. Quyền ghi bật: `send_sol` tới `11111111111111111111111111111111` với `1000` lamports trả `signature: "mock-<idempotencyKey>"`.

<a id="mcp-5"></a>
## Bước 5 — Mock-client test qua stdio

**Khái niệm:** [tests](./lessons.md#1613-tests) · [test matrix](./lessons.md#test-matrix)

Test ở bước 2–3 gọi thẳng `SolanaTools`. Bước này dựng một MCP client thật, chạy `src/server.ts` thành child process và nói chuyện qua stdio, giống cách host làm.

### 5a. Hàm mở client

**Tạo `tests/server.test.ts`:**

<!-- file: tests/server.test.ts; mode: replace -->
```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

let client: Client | undefined;
afterEach(() => client?.close());

const connect = async (env: Record<string, string> = {}) => {
  client = new Client({ name: "mock-host", version: "1.0.0" });
  const command = process.execPath;
  const args = ["--import", "tsx", "src/server.ts"];
  await client.connect(new StdioClientTransport({ command, args, env }));
  return client;
};
```

<!-- check: pnpm run check -->
Chạy `pnpm run check`: không lỗi.

`process.execPath` là đường dẫn tới chính Node đang chạy test; `--import tsx` cho Node chạy thẳng file `.ts`. Không dùng `pnpm start` vì pnpm in banner ra stdout.

### 5b. Liệt kê tool và gọi read tool

**Thêm vào cuối `tests/server.test.ts`:**

<!-- file: tests/server.test.ts; mode: append -->
```ts

describe("MCP server qua stdio", () => {
  it("liệt kê bốn tool", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "call_program",
      "get_account_balance",
      "get_token_holdings",
      "send_sol",
    ]);
  });
});
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `8 passed` (2 file test).

### 5c. Structured content và schema chặn input sai

**Chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/server.test.ts; mode: before-last: }); -->
```ts

  it("trả structured content cho read tool", async () => {
    const result = await (await connect()).callTool({
      name: "get_account_balance",
      arguments: { address: "11111111111111111111111111111111" },
    });
    expect(result.structuredContent).toEqual({ result: { ok: true, data: { lamports: 1_000_000_000 } } });
  });

  it("schema chặn lamports âm trước khi vào core", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: -1, idempotencyKey: "a" };
    const result = await (await connect()).callTool({ name: "send_sol", arguments: send });
    expect(result.isError).toBe(true);
  });
```

<!-- check: pnpm test -->
Chạy `pnpm test`: `10 passed`.

### 5d. Quyền ghi qua protocol

**Chèn vào cuối `describe`**, ngay trên dòng `});` cuối file, cách một dòng trống:

<!-- file: tests/server.test.ts; mode: before-last: }); -->
```ts

  it("authorized: true trong arguments không bật được quyền ghi", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: 1, idempotencyKey: "a" };
    const result = await (await connect()).callTool({ name: "send_sol", arguments: { ...send, authorized: true } });
    expect(result.structuredContent).toMatchObject({ result: { error: { code: "UNAUTHORIZED" } } });
  });

  it("server bật quyền ghi bằng biến môi trường", async () => {
    const send = { recipient: "11111111111111111111111111111111", lamports: 1, idempotencyKey: "a" };
    const tools = await connect({ SOLANA_MCP_WRITE_ENABLED: "true" });
    const result = await tools.callTool({ name: "send_sol", arguments: send });
    expect(result.structuredContent).toEqual({ result: { ok: true, data: { signature: "mock-a" } } });
  });
```

<!-- check: pnpm run check && pnpm test -->
Chạy `pnpm run check && pnpm test`: `12 passed` (2 file test). `tests/server.test.ts` giờ giống `final/tests/server.test.ts`.

## Đối chiếu

Sau bước 5, `src/core.ts`, `src/server.ts`, `tests/core.test.ts` và `tests/server.test.ts` giống hệt bản trong [`final`](../../projects/mcp-solana-server/final/). `package.json` chỉ khác tên project và field `license`; `tsconfig.json` chỉ khác xuống dòng.
