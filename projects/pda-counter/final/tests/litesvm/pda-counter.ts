import * as anchor from "@coral-xyz/anchor";
import { Keypair, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { deriveCounter } from "../fixtures/pda";
import { createCtx } from "./setup";

describe("module 05 — LiteSVM TS (in-process runtime)", () => {
  const ctx = createCtx();

  const setupCounter = async () => {
    const owner = Keypair.generate();
    ctx.airdrop(owner.publicKey);
    const counter = deriveCounter(owner.publicKey, ctx.programId);

    const ix = await ctx.program.methods
      .initialize()
      .accountsPartial({ counter, owner: owner.publicKey })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = owner.publicKey;
    ctx.send(tx, [owner]);
    return { owner, counter };
  };

  const buildUpdateTx = async (
    method: "increment" | "decrement" | "reset",
    counter: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
  ): Promise<Transaction> => {
    const ix = await ctx.program.methods[method]()
      .accountsPartial({ counter, owner })
      .instruction();
    const tx = new Transaction().add(ix);
    tx.feePayer = owner;
    return tx;
  };

  it("derive cùng PDA từ cùng owner (không cần validator)", () => {
    const owner = Keypair.generate().publicKey;
    expect(
      deriveCounter(owner, ctx.programId).equals(deriveCounter(owner, ctx.programId)),
    ).to.equal(true);
  });

  it("TODO 1 — initialize lưu đúng owner và value = 0", async () => {
    const { owner, counter } = await setupCounter();
    const state = ctx.fetchCounter(counter);
    expect(state.owner.equals(owner.publicKey)).to.equal(true);
    expect(state.value.toNumber()).to.equal(0);
    expect(state.bump).to.be.a("number");
  });

  it("TODO 2 — duplicate initialize thất bại", async () => {
    const { owner, counter } = await setupCounter();

    const ix = await ctx.program.methods
      .initialize()
      .accountsPartial({ counter, owner: owner.publicKey })
      .instruction();
    const tx = new Transaction().add(ix);
    tx.feePayer = owner.publicKey;

    ctx.expectSendFailure(tx, [owner], /already in use|Allocate|custom program error/i);
  });

  it("TODO 3 — increment, decrement, reset đúng state", async () => {
    const { owner, counter } = await setupCounter();

    ctx.send(await buildUpdateTx("increment", counter, owner.publicKey), [owner]);
    ctx.send(await buildUpdateTx("increment", counter, owner.publicKey), [owner]);
    ctx.send(await buildUpdateTx("decrement", counter, owner.publicKey), [owner]);
    expect(ctx.fetchCounter(counter).value.toNumber()).to.equal(1);

    ctx.send(await buildUpdateTx("reset", counter, owner.publicKey), [owner]);
    expect(ctx.fetchCounter(counter).value.toNumber()).to.equal(0);
  });

  it("TODO 4 — underflow trả custom error và state rollback", async () => {
    const { owner, counter } = await setupCounter();
    const before = ctx.fetchCounter(counter);

    ctx.expectSendFailure(
      await buildUpdateTx("decrement", counter, owner.publicKey),
      [owner],
      /Underflow|Counter đang bằng 0|0x1771/i,
    );

    const after = ctx.fetchCounter(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });

  it("TODO 5 — wrong authority bị từ chối và state rollback", async () => {
    const { owner, counter } = await setupCounter();
    ctx.send(await buildUpdateTx("increment", counter, owner.publicKey), [owner]);
    const before = ctx.fetchCounter(counter);

    const attacker = Keypair.generate();
    ctx.airdrop(attacker.publicKey);
    const badTx = await buildUpdateTx("increment", counter, attacker.publicKey);

    ctx.expectSendFailure(
      badTx,
      [attacker],
      /ConstraintSeeds|seeds constraint|has_one|ConstraintHasOne/i,
    );

    const after = ctx.fetchCounter(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });

  it("BONUS — chạy 100 increment liên tục để cảm nhận tốc độ LiteSVM", async () => {
    const { owner, counter } = await setupCounter();
    const rounds = 100;

    const start = process.hrtime.bigint();
    for (let i = 0; i < rounds; i += 1) {
      ctx.send(await buildUpdateTx("increment", counter, owner.publicKey), [owner]);
    }
    const elapsedMs = Number((process.hrtime.bigint() - start) / 1_000_000n);

    expect(ctx.fetchCounter(counter).value.toNumber()).to.equal(rounds);
    // eslint-disable-next-line no-console
    console.log(`    ⏱  ${rounds} increment mất ${elapsedMs}ms qua LiteSVM`);
  });
});
