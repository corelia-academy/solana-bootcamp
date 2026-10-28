import type { Action, AuditEntry, AuditPort, ExecutionPort, ExecutionResult, Proposal } from "./agent.js";

export interface McpPort {
  call(input: {
    action: Exclude<Action, "x402">;
    target: string;
    amount: string;
    slippageBps: number;
    idempotencyKey: string;
  }): Promise<ExecutionResult>;
}
export interface X402Port {
  pay(input: { resourceId: string; amount: string; idempotencyKey: string }): Promise<ExecutionResult>;
}

export class RoutedExecutionAdapter implements ExecutionPort {
  constructor(
    readonly mcp: McpPort,
    readonly x402: X402Port,
  ) {}
  execute(proposal: Proposal): Promise<ExecutionResult> {
    if (proposal.action === "x402")
      return this.x402.pay({
        resourceId: proposal.target,
        amount: proposal.amount.toString(),
        idempotencyKey: proposal.idempotencyKey,
      });
    return this.mcp.call({
      action: proposal.action,
      target: proposal.target,
      amount: proposal.amount.toString(),
      slippageBps: proposal.slippageBps,
      idempotencyKey: proposal.idempotencyKey,
    });
  }
}

export class MemoryAuditStore implements AuditPort {
  readonly entries: AuditEntry[] = [];
  async append(entry: AuditEntry): Promise<void> {
    this.entries.push(structuredClone(entry));
  }
}
