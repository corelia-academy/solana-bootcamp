import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("pda-counter starter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.pdaCounter as Program;
  const owner = provider.wallet.publicKey;
  const [counter] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), owner.toBuffer()],
    program.programId,
  );

  it("derive đúng counter PDA", () => {
    expect(counter.equals(anchor.web3.PublicKey.default)).to.equal(false);
  });

  it("TODO: initialize value = 0", async () => {
    await program.methods.initialize().accounts({ counter, owner }).rpc();
    const state = await program.account.counter.fetch(counter);
    expect(state.value.toNumber()).to.equal(0);
  });

  it.skip("TODO: increment/decrement/reset và error cases", () => {});
});
