import type { Cluster } from "./domain";
export function explorerTransactionUrl(signature:string,cluster:Cluster):string{if(!signature)throw new Error("signature không được rỗng");const base=`https://explorer.solana.com/tx/${encodeURIComponent(signature)}`;return cluster==="mainnet-beta"?base:`${base}?cluster=${cluster==="localnet"?"custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899":"devnet"}`;}
