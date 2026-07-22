export type PaymentRequirements={version:1;network:"solana-devnet";asset:string;amount:string;recipient:string;nonce:string;expiresAt:number;resourceId:string};
export function createRequirements(_input:Omit<PaymentRequirements,"version">):PaymentRequirements{throw new Error("TODO: validate và tạo 402 challenge")}
