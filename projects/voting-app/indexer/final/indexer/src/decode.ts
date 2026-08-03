import { BorshCoder, EventParser, web3, type Idl } from "@anchor-lang/core";
import idl from "../idl/voting.json" with { type: "json" };

export const PROGRAM_ID = new web3.PublicKey(idl.address);
const parser = new EventParser(PROGRAM_ID, new BorshCoder(idl as Idl));

export type RawTx = {
  signature: string;
  slot: number;
  blockTime: number | null;
  logs: string[];
};

export type VoteEvent = {
  signature: string;
  eventIndex: number;
  slot: number;
  blockTime: number | null;
  programId: string;
  version: number;
  poll: string;
  candidate: string;
  voter: string;
  candidateId: number;
  votes: string;
};

export function decodeVoteEvents(tx: RawTx): VoteEvent[] {
  const events: VoteEvent[] = [];
  let eventIndex = 0;
  for (const event of parser.parseLogs(tx.logs)) {
    const index = eventIndex++;
    if (event.name !== "VoteCast") continue;
    const data = event.data;
    events.push({
      signature: tx.signature,
      eventIndex: index,
      slot: tx.slot,
      blockTime: tx.blockTime,
      programId: PROGRAM_ID.toBase58(),
      version: data.version,
      poll: data.poll.toBase58(),
      candidate: data.candidate.toBase58(),
      voter: data.voter.toBase58(),
      candidateId: data.candidate_id,
      votes: data.votes.toString(),
    });
  }
  return events;
}
