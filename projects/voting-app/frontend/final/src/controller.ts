import type { Poll, VoteState, VotingClient, WalletPort } from "./domain";

export async function voteAndRefresh(input: {
  wallet: WalletPort; client: VotingClient; pollId: string; candidateId: number;
  setState(state: VoteState): void; setPolls(polls: Poll[]): void;
}): Promise<void> {
  if (!input.wallet.connected || !input.wallet.publicKey) {
    input.setState({ phase: "error", message: "Hãy kết nối wallet trước khi vote" });
    return;
  }
  try {
    input.setState({ phase: "awaiting-signature", message: "Đang chờ wallet ký" });
    const signature = await input.client.vote({ pollId: input.pollId, candidateId: input.candidateId, voter: input.wallet.publicKey });
    input.setState({ phase: "confirming", signature, message: "Đang xác nhận transaction" });
    await input.client.confirm(signature);
    input.setPolls(await input.client.listPolls());
    input.setState({ phase: "success", signature, message: "Vote đã được xác nhận" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction thất bại";
    input.setState({ phase: "error", message });
  }
}
