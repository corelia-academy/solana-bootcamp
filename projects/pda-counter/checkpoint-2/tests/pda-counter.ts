import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("pda-counter checkpoint 2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.pdaCounter as Program;
  const owner = provider.wallet.publicKey;
  const [counter] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), owner.toBuffer()],
    program.programId,
  );

  it("initialize và update counter", async () => {
    await program.methods.initialize().accounts({ counter, owner }).rpc();
    await program.methods.increment().accounts({ counter, owner }).rpc();
    await program.methods.increment().accounts({ counter, owner }).rpc();
    await program.methods.decrement().accounts({ counter, owner }).rpc();
    const state = await program.account.counter.fetch(counter);
    expect(state.value.toNumber()).to.equal(1);
  });

  it.skip("TODO: reset", () => {});
  it.skip("TODO: duplicate initialize, underflow và wrong authority", () => {});
});
