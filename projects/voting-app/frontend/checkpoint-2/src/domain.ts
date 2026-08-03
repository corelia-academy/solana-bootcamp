export type Cluster = "localnet" | "devnet" | "mainnet-beta";
export type Candidate = { id: number; name: string; votes: number };
export type Poll = { id: string; title: string; startsAt: number; endsAt: number; candidates: Candidate[] };
export type WalletPort = { connected: boolean; publicKey?: string };
export type VotingClient = {
  listPolls(): Promise<Poll[]>;
  vote(input: { pollId: string; candidateId: number; voter: string }): Promise<string>;
  confirm(signature: string): Promise<void>;
};
export type VotePhase = "idle" | "awaiting-signature" | "confirming" | "success" | "error";
export type VoteState = { phase: VotePhase; signature?: string; message?: string };
