export type PaymentRequirements={version:1;network:"solana-devnet";asset:string;amount:string;recipient:string;nonce:string;expiresAt:number;resourceId:string};
export type PaymentProof={signature:string;nonce:string};
export type Settlement={signature:string;confirmed:boolean;success:boolean;network:string;asset:string;amount:bigint;recipient:string;memo:string};
export type VerificationResult={ok:true}|{ok:false;code:"INVALID"|"EXPIRED"|"REPLAY"|"UNCONFIRMED"|"RPC_TIMEOUT";retryable:boolean};
export interface SettlementReader{get(signature:string):Promise<Settlement>}

export class ReplayStore{readonly #used=new Set<string>();consume(nonce:string):boolean{if(this.#used.has(nonce))return false;this.#used.add(nonce);return true}}

export function createRequirements(input:Omit<PaymentRequirements,"version">):PaymentRequirements{if(BigInt(input.amount)<=0n||input.expiresAt<=0||!input.nonce)throw new Error("INVALID_REQUIREMENTS");return{version:1,...input}}

export async function verifyPayment(req:PaymentRequirements,proof:PaymentProof,reader:SettlementReader,replay:ReplayStore,now:number):Promise<VerificationResult>{
  if(now>req.expiresAt)return{ok:false,code:"EXPIRED",retryable:false};
  if(proof.nonce!==req.nonce)return{ok:false,code:"INVALID",retryable:false};
  let tx:Settlement;try{tx=await reader.get(proof.signature)}catch{return{ok:false,code:"RPC_TIMEOUT",retryable:true}}
  if(!tx.confirmed)return{ok:false,code:"UNCONFIRMED",retryable:true};
  if(!tx.success||tx.network!==req.network||tx.asset!==req.asset||tx.amount!==BigInt(req.amount)||tx.recipient!==req.recipient||tx.memo!==req.nonce)return{ok:false,code:"INVALID",retryable:false};
  if(!replay.consume(req.nonce))return{ok:false,code:"REPLAY",retryable:false};
  return{ok:true};
}
