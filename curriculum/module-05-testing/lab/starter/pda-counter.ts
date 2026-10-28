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

  it("derive cùng PDA từ cùng owner", () => {
    const owner = anchor.web3.Keypair.generate().publicKey;
    expect(deriveCounter(owner).equals(deriveCounter(owner))).to.equal(true);
  });

  it.skip("TODO 1: initialize lưu đúng owner và value = 0", async () => {});
  it.skip("TODO 2: duplicate initialize thất bại", async () => {});
  it.skip("TODO 3: increment, decrement và reset đúng state", async () => {});
  it.skip("TODO 4: underflow trả custom error và rollback state", async () => {});
  it.skip("TODO 5: wrong authority bị từ chối và rollback state", async () => {});
});
