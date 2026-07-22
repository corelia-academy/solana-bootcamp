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
export type AgentPolicy={killSwitch:boolean;allowedTargets:Set<string>;maxAmount:bigint;maxSessionAmount?:bigint;approvalAbove:bigint;maxSlippageBps:number};

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
 #spent=0n;
 constructor(readonly perception:PerceptionPort,readonly decision:DecisionProvider,readonly execution:ExecutionPort,readonly approval:ApprovalPort,readonly audit:AuditPort,readonly policy:AgentPolicy){}
 async run():Promise<ExecutionResult>{
  const observation=await this.perception.observe();const proposal=await this.decision.propose(observation);await this.audit.append({phase:"proposed",proposal});
  const verdict=evaluatePolicy(proposal,observation,this.policy);
  if(verdict.decision==="deny"){await this.audit.append({phase:"denied",proposal,reason:verdict.reason});return{status:"failed",error:verdict.reason}}
  if(this.#executed.has(proposal.idempotencyKey)){await this.audit.append({phase:"denied",proposal,reason:"DUPLICATE_ACTION"});return{status:"failed",error:"DUPLICATE_ACTION"}}
  if(this.#spent+proposal.amount>(this.policy.maxSessionAmount??this.policy.maxAmount)){await this.audit.append({phase:"denied",proposal,reason:"SESSION_LIMIT"});return{status:"failed",error:"SESSION_LIMIT"}}
  if(verdict.decision==="needs_approval"&&!await this.approval.request(proposal)){await this.audit.append({phase:"approval_rejected",proposal,reason:"APPROVAL_REJECTED"});return{status:"failed",error:"APPROVAL_REJECTED"}}
  this.#executed.add(proposal.idempotencyKey);this.#spent+=proposal.amount;const result=await this.execution.execute(proposal);await this.audit.append({phase:"executed",proposal,result});return result;
 }
}
