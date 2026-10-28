import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

describe("module 05 — PDA Counter testing lab", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program: any = anchor.workspace.pdaCounter;

  const deriveCounter = (owner: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), owner.toBuffer()],
      program.programId,
    )[0];

  const fund = async (wallet: anchor.web3.PublicKey) => {
    const signature = await provider.connection.requestAirdrop(
      wallet,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(signature, "confirmed");
  };

  const setupCounter = async () => {
    const owner = anchor.web3.Keypair.generate();
    const counter = deriveCounter(owner.publicKey);
    await fund(owner.publicKey);
    await program.methods
      .initialize()
      .accounts({ counter, owner: owner.publicKey })
      .signers([owner])
      .rpc();
    return { owner, counter };
  };

  const expectFailure = async (action: Promise<unknown>, pattern: RegExp) => {
    try {
      await action;
      expect.fail("Transaction đáng lẽ phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(pattern);
    }
  };

  it("derive cùng PDA từ cùng owner", () => {
    const owner = anchor.web3.Keypair.generate().publicKey;
    expect(deriveCounter(owner).equals(deriveCounter(owner))).to.equal(true);
  });

  it("initialize lưu đúng owner và value = 0", async () => {
    const { owner, counter } = await setupCounter();
    const state = await program.account.counter.fetch(counter);
    expect(state.owner.equals(owner.publicKey)).to.equal(true);
    expect(state.value.toNumber()).to.equal(0);
  });

  it("duplicate initialize thất bại", async () => {
    const { owner, counter } = await setupCounter();
    await expectFailure(
      program.methods.initialize().accounts({ counter, owner: owner.publicKey }).signers([owner]).rpc(),
      /already in use|Allocate|custom program error/i,
    );
  });

  it("increment, decrement và reset đúng state", async () => {
    const { owner, counter } = await setupCounter();
    const accounts = { counter, owner: owner.publicKey };
    await program.methods.increment().accounts(accounts).signers([owner]).rpc();
    await program.methods.increment().accounts(accounts).signers([owner]).rpc();
    await program.methods.decrement().accounts(accounts).signers([owner]).rpc();
    expect((await program.account.counter.fetch(counter)).value.toNumber()).to.equal(1);
    await program.methods.reset().accounts(accounts).signers([owner]).rpc();
    expect((await program.account.counter.fetch(counter)).value.toNumber()).to.equal(0);
  });

  it("underflow trả custom error và rollback state", async () => {
    const { owner, counter } = await setupCounter();
    const before = await program.account.counter.fetch(counter);
    await expectFailure(
      program.methods.decrement().accounts({ counter, owner: owner.publicKey }).signers([owner]).rpc(),
      /Underflow|Counter đang bằng 0|6001/,
    );
    const after = await program.account.counter.fetch(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });

  it("wrong authority bị từ chối và rollback state", async () => {
    const { counter } = await setupCounter();
    const attacker = anchor.web3.Keypair.generate();
    const before = await program.account.counter.fetch(counter);
    await expectFailure(
      program.methods.increment().accounts({ counter, owner: attacker.publicKey }).signers([attacker]).rpc(),
      /ConstraintSeeds|seeds constraint/i,
    );
    const after = await program.account.counter.fetch(counter);
    expect(after.value.eq(before.value)).to.equal(true);
  });
});
