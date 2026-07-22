export type Action="vote"|"swap"|"x402";
export type Observation={version:string;balances:Record<string,string>;prompt:string;toolData:string};
export type Proposal={action:Action;target:string;amount:bigint;slippageBps:number;reason:string;idempotencyKey:string;observationVersion:string};
export type PolicyResult={decision:"allow"|"deny"|"needs_approval";reason:string};
export type ExecutionResult={status:"confirmed"|"failed";signature?:string;error?:string};
export type AuditEntry={phase:"proposed"|"denied"|"approval_rejected"|"executed";proposal:Proposal;result?:ExecutionResult;reason?:string};
export interface DecisionProvider{propose(observation:Observation):Promise<Proposal>}
export interface PerceptionPort{observe():Promise<Observation>}
export interface ExecutionPort{execute(proposal:Proposal):Promise<ExecutionResult>}
export interface ApprovalPort{request(proposal:Proposal):Promise<boolean>}
export interface AuditPort{append(entry:AuditEntry):Promise<void>}
export type AgentPolicy={killSwitch:boolean;allowedTargets:Set<string>;maxAmount:bigint;approvalAbove:bigint;maxSlippageBps:number};

export function evaluatePolicy(proposal:Proposal,observation:Observation,policy:AgentPolicy):PolicyResult{
 if(policy.killSwitch)return{decision:"deny",reason:"KILL_SWITCH"};
 if(proposal.observationVersion!==observation.version)return{decision:"deny",reason:"STALE_STATE"};
 if(!proposal.idempotencyKey||!policy.allowedTargets.has(proposal.target))return{decision:"deny",reason:"TARGET_NOT_ALLOWED"};
 if(proposal.amount<0n||proposal.amount>policy.maxAmount)return{decision:"deny",reason:"AMOUNT_LIMIT"};
 if(!Number.isInteger(proposal.slippageBps)||proposal.slippageBps<0||proposal.slippageBps>policy.maxSlippageBps)return{decision:"deny",reason:"SLIPPAGE_LIMIT"};
 return proposal.amount>policy.approvalAbove?{decision:"needs_approval",reason:"AMOUNT_THRESHOLD"}:{decision:"allow",reason:"POLICY_OK"};
}

export class Agent{
 readonly #executed=new Set<string>();
 constructor(readonly perception:PerceptionPort,readonly decision:DecisionProvider,readonly execution:ExecutionPort,readonly approval:ApprovalPort,readonly audit:AuditPort,readonly policy:AgentPolicy){}
 async run():Promise<ExecutionResult>{
  const observation=await this.perception.observe();
  const proposal=await this.decision.propose(observation);
  await this.audit.append({phase:"proposed",proposal});
  const verdict=evaluatePolicy(proposal,observation,this.policy);
  return {status:"failed",error:`Checkpoint 2: execute sau ${verdict.decision}`};
}
}
