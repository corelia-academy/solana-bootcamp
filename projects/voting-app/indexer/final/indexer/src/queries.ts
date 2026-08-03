import type pg from "pg";
import { CHECKPOINT } from "./store.ts";

export async function indexedSlot(pool: pg.Pool) {
  const { rows } = await pool.query("SELECT slot FROM checkpoints WHERE name = $1", [CHECKPOINT]);
  return rows[0]?.slot ?? null;
}

export async function leaderboard(pool: pg.Pool, poll: string) {
  const { rows } = await pool.query(
    `SELECT candidate, candidate_id AS "candidateId", count(*) AS votes
     FROM vote_events WHERE poll = $1
     GROUP BY candidate, candidate_id
     ORDER BY votes DESC, candidate_id
     LIMIT 100`,
    [poll],
  );
  return rows;
}

export type Cursor = { slot: number; signature: string; eventIndex: number };

export async function listVotes(pool: pg.Pool, poll: string, limit: number, after?: Cursor) {
  const { rows } = await pool.query(
    `SELECT signature, event_index AS "eventIndex", slot, block_time AS "blockTime",
            voter, candidate, candidate_id AS "candidateId"
     FROM vote_events
     WHERE poll = $1 AND ($2::bigint IS NULL OR (slot, signature, event_index) < ($2, $3, $4))
     ORDER BY slot DESC, signature DESC, event_index DESC
     LIMIT $5`,
    [poll, after?.slot ?? null, after?.signature ?? null, after?.eventIndex ?? null, limit],
  );
  return rows;
}
