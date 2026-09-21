import type pg from "pg";
import { afterAll, beforeAll } from "vitest";
import { createPool } from "../src/db.ts";
import { migrate } from "../src/migrate.ts";

const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/vote_indexer_test";

export function useTestPool() {
  const db = {} as { pool: pg.Pool };
  beforeAll(async () => {
    db.pool = createPool(url);
    await migrate(db.pool);
    await db.pool.query("TRUNCATE vote_events, checkpoints");
  });
  afterAll(() => db.pool.end());
  return db;
}
