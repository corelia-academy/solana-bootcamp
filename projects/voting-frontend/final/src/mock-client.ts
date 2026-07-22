import type { Poll, VotingClient } from "./domain";

export class MockVotingClient implements VotingClient {
  #polls: Poll[] = [{ id: "1", title: "Workshop tiếp theo?", startsAt: 0, endsAt: 4_102_444_800, candidates: [{ id: 0, name: "Security", votes: 2 }, { id: 1, name: "DeFi", votes: 1 }] }];
  async listPolls(): Promise<Poll[]> { return structuredClone(this.#polls); }
  async vote({ pollId, candidateId }: { pollId: string; candidateId: number; voter: string }): Promise<string> {
    const poll = this.#polls.find((item) => item.id === pollId);
    const candidate = poll?.candidates.find((item) => item.id === candidateId);
    if (!candidate) throw new Error("Poll hoặc candidate không tồn tại");
    candidate.votes += 1;
    return `mock-${pollId}-${candidateId}`;
  }
  async confirm(): Promise<void> {}
}
