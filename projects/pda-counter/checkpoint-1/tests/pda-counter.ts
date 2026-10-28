import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

describe("pda-counter checkpoint 1", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types).
  const program: any = anchor.workspace.pdaCounter;
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
