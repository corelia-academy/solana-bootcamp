import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("pda-counter checkpoint 1", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.pdaCounter as Program;
  const owner = provider.wallet.publicKey;
  const [counter] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), owner.toBuffer()],
    program.programId,
  );

  it("initialize đúng owner, value và PDA", async () => {
    await program.methods.initialize().accounts({ counter, owner }).rpc();
    const state = await program.account.counter.fetch(counter);
    expect(state.owner.equals(owner)).to.equal(true);
    expect(state.value.toNumber()).to.equal(0);
  });

  it.skip("TODO: increment và decrement", () => {});
  it.skip("TODO: reset và error cases", () => {});
});
