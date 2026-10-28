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

export type TokenHolding = { mint: string; amount: string };

export interface RpcPort {
  balance(address: string): Promise<number>;
  tokenHoldings(address: string, limit: number): Promise<TokenHolding[]>;
  simulate(input: { program: string; instruction: string }): Promise<boolean>;
  sendSol(recipient: string, lamports: number, idempotencyKey: string): Promise<string>;
  confirm(signature: string): Promise<void>;
}

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

const validKey = (key: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key);

const failure = (code: ToolErrorCode, message: string, retryable = false): ToolResult<never> => ({
  ok: false,
  error: { code, message, retryable },
});

export class SolanaTools {
  constructor(
    readonly rpc: RpcPort,
    readonly policy: Policy,
    readonly auth: AuthPort,
  ) {}

  async getAccountBalance(address: string): Promise<ToolResult<{ lamports: number }>> {
    if (!validKey(address)) return failure("INVALID_INPUT", "Public key không hợp lệ");
    try {
      return { ok: true, data: { lamports: await this.rpc.balance(address) } };
    } catch {
      return failure("RPC_TIMEOUT", "RPC timeout", true);
    }
  }

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
  }

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
}
