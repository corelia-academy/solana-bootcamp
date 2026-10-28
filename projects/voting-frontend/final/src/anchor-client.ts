import { BN, type Program } from "@anchor-lang/core";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, type Connection } from "@solana/web3.js";
import type { Poll, VotingClient } from "./domain";

const bytes = (value: string) => new TextEncoder().encode(value);
const u16le = (value: number) => Uint8Array.from(new BN(value).toArray("le", 2));

/**
 * Adapter Devnet cho Voting App Module 6.
 *
 * `program` là Anchor Program tạo từ IDL (`src/idl/voting.json`) với provider có wallet.
 * Dùng `Program<any>` để file build được trước khi IDL được copy vào frontend.
 *
 * `Poll.id` ở adapter này là ĐỊA CHỈ Poll account (base58), vì Poll PDA gồm cả authority:
 * hai authority khác nhau có thể dùng cùng `poll_id`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAnchorVotingClient(program: Program<any>, connection: Connection): VotingClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = program.account as any;

  return {
    async listPolls(): Promise<Poll[]> {
      const [pollRows, candidateRows] = await Promise.all([accounts.poll.all(), accounts.candidate.all()]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return pollRows.map((row: any) => {
        const pollKey = row.publicKey as PublicKey;
        const candidates = candidateRows
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => item.account.poll.equals(pollKey))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => ({
            id: item.account.candidateId as number,
            name: item.account.name as string,
            votes: Number(item.account.votes.toString()),
          }));
        return {
          id: pollKey.toBase58(),
          title: row.account.title as string,
          startsAt: Number(row.account.startTime.toString()),
          endsAt: Number(row.account.endTime.toString()),
          candidates,
        };
      });
    },

    async vote({ pollId, candidateId, voter }) {
      const poll = new PublicKey(pollId);
      const voterKey = new PublicKey(voter);
      // Đọc poll_id (u64) từ chain thay vì tin client truyền.
      const state = await accounts.poll.fetch(poll);
      const [candidate] = PublicKey.findProgramAddressSync(
        [bytes("candidate"), poll.toBytes(), u16le(candidateId)],
        program.programId,
      );
      const [voteReceipt] = PublicKey.findProgramAddressSync(
        [bytes("vote"), poll.toBytes(), voterKey.toBytes()],
        program.programId,
      );
      return program.methods
        .vote(state.pollId as BN, candidateId)
        .accountsPartial({
          poll,
          candidate,
          voteReceipt,
          voter: voterKey,
          clock: SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },

    async confirm(signature) {
      const latest = await connection.getLatestBlockhash("confirmed");
      const result = await connection.confirmTransaction({ signature, ...latest }, "confirmed");
      if (result.value.err) throw new Error(`Transaction lỗi: ${JSON.stringify(result.value.err)}`);
    },
  };
}
