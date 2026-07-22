export type PaymentRequirements={version:1;network:"solana-devnet";asset:string;amount:string;recipient:string;nonce:string;expiresAt:number;resourceId:string};
export function createRequirements(input:Omit<PaymentRequirements,"version">):PaymentRequirements{if(BigInt(input.amount)<=0n||input.expiresAt<=0||!input.nonce)throw new Error("INVALID_REQUIREMENTS");return{version:1,...input}}
