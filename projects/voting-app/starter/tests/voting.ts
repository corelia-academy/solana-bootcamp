import * as anchor from "@anchor-lang/core";
import { BN } from "@anchor-lang/core";
import { expect } from "chai";

describe("voting starter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/voting.ts).
  const program: any = anchor.workspace.voting;
  const pollId = new BN(Date.now());
  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), provider.wallet.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );

  it("derive Poll PDA", () => {
    expect(poll.equals(anchor.web3.PublicKey.default)).to.equal(false);
  });

  it("TODO: initialize poll", async () => {
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .initializePoll(pollId, "Bootcamp Poll", new BN(now + 60), new BN(now + 600))
      .accounts({ poll, authority: provider.wallet.publicKey })
      .rpc();
  });

  it.skip("TODO: candidate, vote và error cases", () => {});
});
