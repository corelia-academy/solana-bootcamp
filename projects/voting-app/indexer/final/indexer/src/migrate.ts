import { readdir, readFile } from "node:fs/promises";
import type pg from "pg";
import { withTransaction } from "./db.ts";

const dir = new URL("../db/", import.meta.url);

export async function migrate(pool: pg.Pool) {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const done = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (done.rowCount) continue;
    const sql = await readFile(new URL(name, dir), "utf8");
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    });
  }
}
