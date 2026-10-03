import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/voting.ts).
  const program: any = anchor.workspace.voting;
  const authority = provider.wallet.publicKey;
  const pollId = new anchor.BN(Date.now());
  const candidateId = 1;
  const now = Math.floor(Date.now() / 1000);
  const startTime = new anchor.BN(now + 4);
  const endTime = new anchor.BN(now + 600);

  const [poll] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), provider.wallet.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId,
  );
  const [candidate] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("candidate"),
      poll.toBuffer(),
      new anchor.BN(candidateId).toArrayLike(Buffer, "le", 2),
    ],
    program.programId,
  );
  const [voteReceipt] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), poll.toBuffer(), authority.toBuffer()],
    program.programId,
  );

  function findPoll(id: anchor.BN) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), authority.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  }

  function findCandidate(pollAddress: anchor.web3.PublicKey, id: number) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollAddress.toBuffer(), new anchor.BN(id).toArrayLike(Buffer, "le", 2)],
      program.programId,
    )[0];
  }

  async function fund(to: anchor.web3.PublicKey) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({ fromPubkey: authority, toPubkey: to, lamports: 10_000_000 }),
    );
    await provider.sendAndConfirm(tx);
  }

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

  it("từ chối ví khác authority thêm candidate", async () => {
    const stranger = anchor.web3.Keypair.generate();
    const strangerCandidate = findCandidate(poll, 2);
    await fund(stranger.publicKey);
    try {
      await program.methods
        .addCandidate(pollId, 2, "Candidate lạ")
        .accounts({ poll, candidate: strangerCandidate, authority: stranger.publicKey })
        .signers([stranger])
        .rpc();
      expect.fail("ví không phải authority phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.match(/ConstraintSeeds|ConstraintHasOne/);
    }
    const pollState = await program.account.poll.fetch(poll);
    expect(pollState.candidateCount).to.equal(1);
  });

  it("từ chối time window không hợp lệ", async () => {
    const badPollId = pollId.addn(1);
    const badPoll = findPoll(badPollId);
    try {
      await program.methods
        .initializePoll(badPollId, "Sai giờ", endTime, startTime)
        .accounts({ poll: badPoll, authority })
        .rpc();
      expect.fail("start_time >= end_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
    }
    expect(await program.account.poll.fetchNullable(badPoll)).to.equal(null);
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

  it("từ chối candidate thuộc poll khác", async () => {
    const otherPollId = pollId.addn(2);
    const otherPoll = findPoll(otherPollId);
    const otherCandidate = findCandidate(otherPoll, candidateId);
    await program.methods
      .initializePoll(otherPollId, "Poll khác", endTime, endTime.addn(600))
      .accounts({ poll: otherPoll, authority })
      .rpc();
    await program.methods
      .addCandidate(otherPollId, candidateId, "Candidate B")
      .accounts({ poll: otherPoll, candidate: otherCandidate, authority })
      .rpc();

    try {
      await program.methods
        .vote(pollId, candidateId)
        .accounts({ poll, candidate: otherCandidate, voteReceipt, voter: authority })
        .rpc();
      expect.fail("candidate của poll khác phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.match(/ConstraintSeeds|ConstraintHasOne/);
    }
    const otherState = await program.account.candidate.fetch(otherCandidate);
    expect(otherState.votes.toNumber()).to.equal(0);
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
    const state = await program.account.candidate.fetch(candidate);
    expect(state.votes.toNumber()).to.equal(1);
  });

  it("từ chối thêm candidate sau khi poll bắt đầu", async () => {
    const lateCandidate = findCandidate(poll, 2);
    try {
      await program.methods
        .addCandidate(pollId, 2, "Candidate muộn")
        .accounts({ poll, candidate: lateCandidate, authority })
        .rpc();
      expect.fail("thêm candidate sau start_time phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("Poll đã bắt đầu nên không thể thêm candidate");
    }
    const pollState = await program.account.poll.fetch(poll);
    expect(pollState.candidateCount).to.equal(1);
  });

  it("vote phát event VoteCast", async () => {
    const voter = anchor.web3.Keypair.generate();
    const airdrop = await provider.connection.requestAirdrop(voter.publicKey, 1_000_000_000);
    await provider.connection.confirmTransaction(airdrop, "confirmed");
    const [receipt] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), poll.toBuffer(), voter.publicKey.toBuffer()],
      program.programId,
    );
    const signature = await program.methods
      .vote(pollId, candidateId)
      .accounts({ poll, candidate, voteReceipt: receipt, voter: voter.publicKey })
      .signers([voter])
      .rpc({ commitment: "confirmed" });

    const tx = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(program.programId, program.coder);
    const events = [...parser.parseLogs(tx!.meta!.logMessages!)];
    expect(events).to.have.length(1);
    expect(events[0].name).to.equal("voteCast");
    expect(events[0].data.voter.equals(voter.publicKey)).to.equal(true);
    expect(events[0].data.votes.toNumber()).to.equal(2);
  });
});
