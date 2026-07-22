export type ToolErrorCode="INVALID_INPUT"|"RPC_TIMEOUT"|"UNAUTHORIZED"|"LIMIT_EXCEEDED"|"NOT_ALLOWED"|"SIMULATION_FAILED"|"CONFIRMATION_FAILED";
export type ToolResult<T>={ok:true,data:T}|{ok:false,error:{code:ToolErrorCode;message:string;retryable:boolean}};
export type TokenHolding={mint:string;amount:string};
export interface RpcPort{balance(address:string):Promise<number>;tokenHoldings(address:string,limit:number):Promise<TokenHolding[]>;simulate(input:{program:string;instruction:string}):Promise<boolean>;sendSol(recipient:string,lamports:number,idempotencyKey:string):Promise<string>;confirm(signature:string):Promise<void>}
export type Policy={allowedRecipients:Set<string>;allowedPrograms:Set<string>;maxLamportsPerAction:number};
const validKey=(key:string)=>/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key);
const failure=(code:ToolErrorCode,message:string,retryable=false):ToolResult<never>=>({ok:false,error:{code,message,retryable}});

export class SolanaTools{
 constructor(readonly rpc:RpcPort,readonly policy:Policy){}
 async getAccountBalance(address:string):Promise<ToolResult<{lamports:number}>>{if(!validKey(address))return failure("INVALID_INPUT","Public key không hợp lệ");try{return{ok:true,data:{lamports:await this.rpc.balance(address)}}}catch{return failure("RPC_TIMEOUT","RPC timeout",true)}}
 async getTokenHoldings(address:string,limit=20):Promise<ToolResult<{items:TokenHolding[]}>>{if(!validKey(address)||!Number.isInteger(limit)||limit<1||limit>100)return failure("INVALID_INPUT","address/limit không hợp lệ");try{return{ok:true,data:{items:(await this.rpc.tokenHoldings(address,limit)).slice(0,limit)}}}catch{return failure("RPC_TIMEOUT","RPC timeout",true)}}
 async sendSol(_input:{recipient:string;lamports:number;idempotencyKey:string;authorized:boolean}):Promise<ToolResult<{signature:string}>>{throw new Error("Checkpoint 2: auth/allowlist/cap/send/confirm")}
 async callProgram(_input:{program:string;instruction:string;authorized:boolean}):Promise<ToolResult<{simulated:true}>>{throw new Error("Checkpoint 2: program allowlist và simulation")}
}
