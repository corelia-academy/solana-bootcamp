export type PlayerRow = { user: string; score: number; points: number };

export function rankPlayers(rows: PlayerRow[], page: number, pageSize: number) {
  const sorted = [...rows].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.user < b.user ? -1 : a.user > b.user ? 1 : 0;
  });
  const start = (page - 1) * pageSize;
  return sorted
    .slice(start, start + pageSize)
    .map((row, index) => ({ rank: start + index + 1, ...row }));
}
