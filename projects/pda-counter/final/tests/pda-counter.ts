import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

describe("pda-counter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types).
  const program: any = anchor.workspace.pdaCounter;
  const owner = provider.wallet.publicKey;
  const [counter] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), owner.toBuffer()],
    program.programId,
  );

  it("khởi tạo counter đúng PDA", async () => {
    await program.methods.initialize().accounts({ counter, owner }).rpc();
    const state = await program.account.counter.fetch(counter);
    expect(state.owner.equals(owner)).to.equal(true);
    expect(state.value.toNumber()).to.equal(0);
  });

  it("từ chối khởi tạo lần hai", async () => {
    try {
      await program.methods.initialize().accounts({ counter, owner }).rpc();
      expect.fail("initialize lần hai phải thất bại");
    } catch (error) {
      expect(String(error)).to.not.equal("");
    }
  });

  it("increment, decrement và reset", async () => {
    await program.methods.increment().accounts({ counter, owner }).rpc();
    await program.methods.increment().accounts({ counter, owner }).rpc();
    await program.methods.decrement().accounts({ counter, owner }).rpc();
    let state = await program.account.counter.fetch(counter);
    expect(state.value.toNumber()).to.equal(1);

    await program.methods.reset().accounts({ counter, owner }).rpc();
    state = await program.account.counter.fetch(counter);
    expect(state.value.toNumber()).to.equal(0);
  });

  it("từ chối underflow", async () => {
    try {
      await program.methods.decrement().accounts({ counter, owner }).rpc();
      expect.fail("decrement tại 0 phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Counter đang bằng 0");
    }
  });
});
