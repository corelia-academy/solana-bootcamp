import * as anchor from "@anchor-lang/core";
import { BN } from "@anchor-lang/core";
import { expect } from "chai";

describe("voting checkpoint 1", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/voting.ts).
  const program: any = anchor.workspace.voting;
  const pollId = new BN(Date.now());
  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), provider.wallet.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );

  it("initialize poll hợp lệ", async () => {
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .initializePoll(pollId, "Bootcamp Poll", new BN(now + 60), new BN(now + 600))
      .accounts({ poll, authority: provider.wallet.publicKey })
      .rpc();
    const state = await program.account.poll.fetch(poll);
    expect(state.title).to.equal("Bootcamp Poll");
  });

  it.skip("TODO: add candidate", () => {});
  it.skip("TODO: vote và receipt", () => {});
});
