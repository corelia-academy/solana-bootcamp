import type { Poll, VotingClient } from "./domain";
export async function loadPolls(client: VotingClient): Promise<{ polls: Poll[]; error?: string }> {
  try {
    return { polls: await client.listPolls() };
  } catch (error) {
    return { polls: [], error: error instanceof Error ? error.message : "Không tải được polls" };
  }
}
