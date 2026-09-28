import * as anchor from "@anchor-lang/core";
import { rankPlayers } from "./leaderboard";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program: any = anchor.workspace.forecasting;

  const accounts = await program.account.player.all();
  const rows = accounts.map((item: any) => ({
    user: item.account.user.toBase58(),
    score: item.account.score.toNumber(),
    points: item.account.points.toNumber(),
  }));

  console.log("ĐIỂM GIẢ LẬP — KHÔNG PHẢI TIỀN THẬT");
  for (const row of rankPlayers(rows, 1, 10)) {
    console.log(`#${row.rank} ${row.user} score=${row.score} points=${row.points}`);
  }
}

main();
