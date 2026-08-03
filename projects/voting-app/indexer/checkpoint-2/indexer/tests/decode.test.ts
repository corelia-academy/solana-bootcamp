import { describe, expect, it } from "vitest";
import { decodeVoteEvents } from "../src/decode.ts";
import { candidates, poll, voteLog, voteTx } from "./fixtures.ts";

describe("decodeVoteEvents", () => {
  it("đọc VoteCast từ log của transaction", () => {
    const [event] = decodeVoteEvents(voteTx("sig-1", 10, voteLog(2, 3)));
    expect(event.signature).toBe("sig-1");
    expect(event.eventIndex).toBe(0);
    expect(event.slot).toBe(10);
    expect(event.poll).toBe(poll.toBase58());
    expect(event.candidate).toBe(candidates[1].toBase58());
    expect(event.candidateId).toBe(2);
    expect(event.votes).toBe("3");
  });

  it("bỏ qua log hỏng và giữ thứ tự event", () => {
    const events = decodeVoteEvents(voteTx("sig-2", 11, voteLog(1, 1), "Program data: !!!", voteLog(1, 2)));
    expect(events.map((event) => event.eventIndex)).toEqual([0, 1]);
    expect(events.map((event) => event.votes)).toEqual(["1", "2"]);
  });
});
