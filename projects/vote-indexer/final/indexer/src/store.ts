import type pg from "pg";
import type { VoteEvent } from "./decode.ts";

export async function saveEvents(client: pg.PoolClient, events: VoteEvent[]) {
  let inserted = 0;
  for (const e of events) {
    const result = await client.query(
      `INSERT INTO vote_events (signature, event_index, slot, block_time, program_id,
         version, poll, candidate, voter, candidate_id, votes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (signature, event_index) DO NOTHING`,
      [e.signature, e.eventIndex, e.slot, e.blockTime, e.programId,
        e.version, e.poll, e.candidate, e.voter, e.candidateId, e.votes],
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

export const CHECKPOINT = "vote-backfill";

export type Checkpoint = { signature: string; slot: number };

export async function getCheckpoint(pool: pg.Pool, name: string): Promise<Checkpoint | null> {
  const { rows } = await pool.query("SELECT signature, slot FROM checkpoints WHERE name = $1", [name]);
  return rows[0] ?? null;
}

export async function setCheckpoint(client: pg.PoolClient, name: string, checkpoint: Checkpoint) {
  await client.query(
    `INSERT INTO checkpoints (name, signature, slot) VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET signature = EXCLUDED.signature, slot = EXCLUDED.slot
     WHERE checkpoints.slot <= EXCLUDED.slot`,
    [name, checkpoint.signature, checkpoint.slot],
  );
}
