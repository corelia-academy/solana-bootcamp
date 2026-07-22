import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("voting starter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.voting as Program;
  const pollId = new BN(Date.now());
  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
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
