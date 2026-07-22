import{describe,expect,it,vi}from"vitest";import{SolanaTools,type RpcPort}from"../src/core.js";
const key="11111111111111111111111111111111";const other="Vote111111111111111111111111111111111111111";
const rpc=(overrides:Partial<RpcPort>={}):RpcPort=>({balance:vi.fn().mockResolvedValue(5),tokenHoldings:vi.fn().mockResolvedValue([{mint:key,amount:"1"}]),simulate:vi.fn().mockResolvedValue(true),sendSol:vi.fn().mockResolvedValue("sig"),confirm:vi.fn().mockResolvedValue(undefined),...overrides});
const make=(r=rpc())=>new SolanaTools(r,{allowedRecipients:new Set([key]),allowedPrograms:new Set([key]),maxLamportsPerAction:100});
describe("Solana MCP tools",()=>{
 it("validate key và bound holdings",async()=>{expect((await make().getAccountBalance("bad")).ok).toBe(false);expect((await make().getTokenHoldings(key,101)).ok).toBe(false)});
 it("RPC error structured/retryable",async()=>expect(await make(rpc({balance:vi.fn().mockRejectedValue(new Error())})).getAccountBalance(key)).toMatchObject({ok:false,error:{code:"RPC_TIMEOUT",retryable:true}}));
 it("deny unauthorized, recipient và cap",async()=>{expect(await make().sendSol({recipient:key,lamports:1,idempotencyKey:"a",authorized:false})).toMatchObject({error:{code:"UNAUTHORIZED"}});expect(await make().sendSol({recipient:other,lamports:1,idempotencyKey:"a",authorized:true})).toMatchObject({error:{code:"NOT_ALLOWED"}});expect(await make().sendSol({recipient:key,lamports:101,idempotencyKey:"a",authorized:true})).toMatchObject({error:{code:"LIMIT_EXCEEDED"}})});
 it("send và confirm success",async()=>expect(await make().sendSol({recipient:key,lamports:10,idempotencyKey:"a",authorized:true})).toEqual({ok:true,data:{signature:"sig"}}));
 it("program write cần authorization",async()=>expect(await make().callProgram({program:key,instruction:"vote",authorized:false})).toMatchObject({error:{code:"UNAUTHORIZED"}}));
 it("program allowlist, simulation và success",async()=>{expect(await make().callProgram({program:other,instruction:"vote",authorized:true})).toMatchObject({error:{code:"NOT_ALLOWED"}});expect(await make(rpc({simulate:vi.fn().mockResolvedValue(false)})).callProgram({program:key,instruction:"vote",authorized:true})).toMatchObject({error:{code:"SIMULATION_FAILED"}});expect(await make().callProgram({program:key,instruction:"vote",authorized:true})).toEqual({ok:true,data:{simulated:true}})});
});
