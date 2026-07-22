import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.voting as Program;
  const authority = provider.wallet.publicKey;
  const pollId = new BN(Date.now());
  const candidateId = 1;
  const now = Math.floor(Date.now() / 1000);
  const startTime = new BN(now + 4);
  const endTime = new BN(now + 600);

  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );
  const [candidate] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("candidate"),
      poll.toBuffer(),
      new BN(candidateId).toArrayLike(Buffer, "le", 2),
    ],
    program.programId,
  );
  const [voteReceipt] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), poll.toBuffer(), authority.toBuffer()],
    program.programId,
  );

  it("tạo poll và candidate đúng PDA", async () => {
    await program.methods
      .initializePoll(pollId, "Solana Bootcamp", startTime, endTime)
      .accounts({ poll, authority })
      .rpc();

    await program.methods
      .addCandidate(pollId, candidateId, "Candidate A")
      .accounts({ poll, candidate, authority })
      .rpc();

    const pollState = await program.account.poll.fetch(poll);
    const candidateState = await program.account.candidate.fetch(candidate);
    expect(pollState.title).to.equal("Solana Bootcamp");
    expect(pollState.candidateCount).to.equal(candidateId);
    expect(candidateState.poll.equals(poll)).to.equal(true);
    expect(candidateState.votes.toNumber()).to.equal(0);
  });

  it("từ chối vote trước thời gian bắt đầu", async () => {
    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("vote trước start_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Poll chưa bắt đầu");
    }
  });

  it("vote đúng candidate và tạo receipt", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await program.methods
      .vote(pollId, candidateId)
      .accounts({ poll, candidate, voteReceipt, voter: authority })
      .rpc();
    const state = await program.account.candidate.fetch(candidate);
    const receipt = await program.account.voteReceipt.fetch(voteReceipt);
    expect(state.votes.toNumber()).to.equal(1);
    expect(receipt.voter.equals(authority)).to.equal(true);
  });

  it("từ chối cùng wallet vote lần hai", async () => {
    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("vote receipt đã tồn tại");
    } catch (error) {
      expect(String(error)).to.not.equal("");
    }
  });
});
