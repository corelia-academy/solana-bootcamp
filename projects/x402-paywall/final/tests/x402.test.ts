import{describe,expect,it}from"vitest";import{createRequirements,ReplayStore,verifyPayment,type Settlement,type SettlementReader}from"../src/x402.js";
const req=createRequirements({network:"solana-devnet",asset:"USDC",amount:"1000",recipient:"merchant",nonce:"nonce-1",expiresAt:200,resourceId:"data"});
const valid:Settlement={signature:"sig",confirmed:true,success:true,network:"solana-devnet",asset:"USDC",amount:1000n,recipient:"merchant",memo:"nonce-1"};
const reader=(value:Settlement|Error):SettlementReader=>({get:async()=>{if(value instanceof Error)throw value;return value}});
describe("x402 verifier",()=>{
 it("accept exact settlement một lần",async()=>expect(await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),new ReplayStore(),100)).toEqual({ok:true}));
 it.each([["asset","OTHER"],["amount",999n],["recipient","attacker"],["memo","wrong"]]as const)("reject wrong %s",async(key,value)=>expect((await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader({...valid,[key]:value}),new ReplayStore(),100)).ok).toBe(false));
 it("expiry/replay",async()=>{const store=new ReplayStore();expect((await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,201))).toMatchObject({code:"EXPIRED"});await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,100);expect(await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,100)).toMatchObject({code:"REPLAY"})});
 it("RPC timeout retryable và không consume nonce",async()=>{const store=new ReplayStore();expect(await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(new Error("timeout")),store,100)).toMatchObject({code:"RPC_TIMEOUT",retryable:true});expect(await verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,100)).toEqual({ok:true})});
 it("concurrent retries chỉ có một success",async()=>{const store=new ReplayStore();const results=await Promise.all([verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,100),verifyPayment(req,{signature:"sig",nonce:"nonce-1"},reader(valid),store,100)]);expect(results.filter(r=>r.ok)).toHaveLength(1)});
});
