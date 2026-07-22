import { useEffect, useState } from "react";
import type { Cluster, Poll, VoteState, VotingClient, WalletPort } from "./domain";
import { voteAndRefresh } from "./controller";
import { explorerTransactionUrl } from "./explorer";

export function App({ client, wallet, cluster = "devnet" }: { client: VotingClient; wallet: WalletPort; cluster?: Cluster }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [voteState, setVoteState] = useState<VoteState>({ phase: "idle" });
  const load = async () => { setLoading(true); setLoadError(undefined); try { setPolls(await client.listPolls()); } catch (e) { setLoadError(e instanceof Error ? e.message : "Không tải được polls"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [client]);
  if (loading) return <main><p>Đang tải polls…</p></main>;
  if (loadError) return <main><p role="alert">{loadError}</p><button onClick={() => void load()}>Thử lại</button></main>;
  return <main><header><h1>Voting App</h1><span>{wallet.connected ? wallet.publicKey : "Wallet chưa kết nối"}</span></header>
    {polls.length === 0 ? <p>Chưa có poll.</p> : polls.map((poll) => <section key={poll.id}><h2>{poll.title}</h2>{poll.candidates.map((candidate) => <button key={candidate.id} disabled={voteState.phase === "awaiting-signature" || voteState.phase === "confirming"} onClick={() => void voteAndRefresh({ wallet, client, pollId: poll.id, candidateId: candidate.id, setState: setVoteState, setPolls })}>{candidate.name}: {candidate.votes}</button>)}</section>)}
    {voteState.message && <p role={voteState.phase === "error" ? "alert" : "status"}>{voteState.message}</p>}
    {voteState.signature && <a href={explorerTransactionUrl(voteState.signature, cluster)}>Xem transaction</a>}
  </main>;
}
