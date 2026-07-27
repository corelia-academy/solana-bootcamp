import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { deriveCounter, expectFailure } from "../fixtures/pda";

describe("module 05 — Anchor TS integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program: any = anchor.workspace.pdaCounter;

  const fund = async (wallet: anchor.web3.PublicKey, lamports = anchor.web3.LAMPORTS_PER_SOL) => {
    const sig = await provider.connection.requestAirdrop(wallet, lamports);
    await provider.connection.confirmTransaction(sig, "confirmed");
  };

  const setupCounter = async () => {
    const owner = anchor.web3.Keypair.generate();
    const counter = deriveCounter(owner.publicKey, program.programId);
    await fund(owner.publicKey);
    await program.methods
      .initialize()
      .accounts({ counter, owner: owner.publicKey })
      .signers([owner])
      .rpc();
    return { owner, counter };
  };

  it("derive cùng PDA từ cùng owner", () => {
    const owner = anchor.web3.Keypair.generate().publicKey;
    expect(
      deriveCounter(owner, program.programId).equals(deriveCounter(owner, program.programId)),
    ).to.equal(true);
  });

  it("TODO 1 — initialize lưu đúng owner và value = 0", async () => {
    const { owner, counter } = await setupCounter();
    const state = await program.account.counter.fetch(counter);
    expect(state.owner.equals(owner.publicKey)).to.equal(true);
    expect(state.value.toNumber()).to.equal(0);
    expect(state.bump).to.be.a("number");
  });

  it("TODO 2 — duplicate initialize thất bại", async () => {
    const { owner, counter } = await setupCounter();
    await expectFailure(
      program.methods
        .initialize()
        .accounts({ counter, owner: owner.publicKey })
        .signers([owner])
        .rpc(),
      /already in use|Allocate|custom program error/i,
    );
  });

  it("TODO 3 — increment, decrement, reset đúng state", async () => {
    const { owner, counter } = await setupCounter();
    const accounts = { counter, owner: owner.publicKey };

    await program.methods.increment().accounts(accounts).signers([owner]).rpc();
    await program.methods.increment().accounts(accounts).signers([owner]).rpc();
    await program.methods.decrement().accounts(accounts).signers([owner]).rpc();
    expect(
      (await program.account.counter.fetch(counter)).value.toNumber(),
    ).to.equal(1);

    await program.methods.reset().accounts(accounts).signers([owner]).rpc();
    expect(
      (await program.account.counter.fetch(counter)).value.toNumber(),
    ).to.equal(0);
  });

  it("TODO 4 — underflow trả custom error và state rollback", async () => {
    const { owner, counter } = await setupCounter();
    const before = await program.account.counter.fetch(counter);

    await expectFailure(
      program.methods
        .decrement()
        .accounts({ counter, owner: owner.publicKey })
        .signers([owner])
        .rpc(),
      /Underflow|Counter đang bằng 0|6001/,
    );

    const after = await program.account.counter.fetch(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });

  it("TODO 5 — wrong authority bị từ chối và state rollback", async () => {
    const { counter } = await setupCounter();
    const attacker = anchor.web3.Keypair.generate();
    await fund(attacker.publicKey);

    const before = await program.account.counter.fetch(counter);

    await expectFailure(
      program.methods
        .increment()
        .accounts({ counter, owner: attacker.publicKey })
        .signers([attacker])
        .rpc(),
      /ConstraintSeeds|seeds constraint|A seeds constraint was violated/i,
    );

    const after = await program.account.counter.fetch(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });

  it("BONUS — PDA của owner khác không tương thích với signer hiện tại", async () => {
    const { owner: victim, counter: victimCounter } = await setupCounter();
    const attacker = anchor.web3.Keypair.generate();
    await fund(attacker.publicKey);

    await expectFailure(
      program.methods
        .increment()
        .accounts({ counter: victimCounter, owner: attacker.publicKey })
        .signers([attacker])
        .rpc(),
      /ConstraintSeeds|has_one|ConstraintHasOne/i,
    );

    const state = await program.account.counter.fetch(victimCounter);
    expect(state.owner.equals(victim.publicKey)).to.equal(true);
  });
});
