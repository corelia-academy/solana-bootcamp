export type Action = "vote" | "swap" | "x402";
export type Observation = { version: string; balances: Record<string, string>; prompt: string; toolData: string };
export type Proposal = {
  action: Action;
  target: string;
  amount: bigint;
  slippageBps: number;
  reason: string;
  idempotencyKey: string;
  observationVersion: string;
};
export type PolicyResult = { decision: "allow" | "deny" | "needs_approval"; reason: string };
export type ExecutionResult = { status: "confirmed" | "failed"; signature?: string; error?: string };
export type AuditEntry = {
  phase: "proposed" | "denied" | "approval_rejected" | "executed";
  proposal: Proposal;
  result?: ExecutionResult;
  reason?: string;
};
export interface DecisionProvider {
  propose(observation: Observation): Promise<Proposal>;
}
export interface PerceptionPort {
  observe(): Promise<Observation>;
}
export interface ExecutionPort {
  execute(proposal: Proposal): Promise<ExecutionResult>;
}
export interface ApprovalPort {
  request(proposal: Proposal): Promise<boolean>;
}
export interface AuditPort {
  append(entry: AuditEntry): Promise<void>;
}
export type AgentPolicy = {
  killSwitch: boolean;
  allowedTargets: Set<string>;
  maxAmount: bigint;
  approvalAbove: bigint;
  maxSlippageBps: number;
};

export function evaluatePolicy(proposal: Proposal, observation: Observation, policy: AgentPolicy): PolicyResult {
  throw new Error("TODO 1: deterministic policy");
}

export class Agent {
  readonly #executed = new Set<string>();
  constructor(
    readonly perception: PerceptionPort,
    readonly decision: DecisionProvider,
    readonly execution: ExecutionPort,
    readonly approval: ApprovalPort,
    readonly audit: AuditPort,
    readonly policy: AgentPolicy,
  ) {}
  async run(): Promise<ExecutionResult> {
    throw new Error("TODO 2: observe → propose → policy → execute → audit");
  }
}
