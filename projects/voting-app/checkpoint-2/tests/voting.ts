import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("voting checkpoint 2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.voting as Program;
  const authority = provider.wallet.publicKey;
  const pollId = new BN(Date.now());
  const candidateId = 1;
  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );
  const [candidate] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), poll.toBuffer(), new BN(1).toArrayLike(Buffer, "le", 2)],
    program.programId,
  );

  it("tạo Poll và Candidate", async () => {
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .initializePoll(pollId, "Bootcamp Poll", new BN(now + 60), new BN(now + 600))
      .accounts({ poll, authority })
      .rpc();
    await program.methods
      .addCandidate(pollId, candidateId, "Candidate A")
      .accounts({ poll, candidate, authority })
      .rpc();
    const state = await program.account.candidate.fetch(candidate);
    expect(state.poll.equals(poll)).to.equal(true);
  });

  it.skip("TODO: vote, duplicate receipt và time errors", () => {});
});
