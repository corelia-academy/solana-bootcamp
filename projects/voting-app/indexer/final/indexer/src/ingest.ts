import { web3 } from "@anchor-lang/core";
import type pg from "pg";
import { withTransaction } from "./db.ts";
import { decodeVoteEvents, PROGRAM_ID } from "./decode.ts";
import { CHECKPOINT, getCheckpoint, saveEvents, setCheckpoint } from "./store.ts";

export async function fetchEvents(connection: web3.Connection, signature: string) {
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || tx.meta?.err || !tx.meta?.logMessages) return [];
  return decodeVoteEvents({ signature, slot: tx.slot, blockTime: tx.blockTime ?? null, logs: tx.meta.logMessages });
}

async function newSignatures(connection: web3.Connection, until?: string) {
  const found: web3.ConfirmedSignatureInfo[] = [];
  let before: string | undefined;
  for (;;) {
    const page = await connection.getSignaturesForAddress(PROGRAM_ID, { before, until, limit: 1000 }, "confirmed");
    found.push(...page);
    if (page.length < 1000) return found.reverse();
    before = page[page.length - 1].signature;
  }
}

export async function backfill(connection: web3.Connection, pool: pg.Pool) {
  const checkpoint = await getCheckpoint(pool, CHECKPOINT);
  let inserted = 0;
  for (const info of await newSignatures(connection, checkpoint?.signature)) {
    const events = info.err ? [] : await fetchEvents(connection, info.signature);
    inserted += await withTransaction(pool, async (client) => {
      const count = await saveEvents(client, events);
      await setCheckpoint(client, CHECKPOINT, { signature: info.signature, slot: info.slot });
      return count;
    });
  }
  return inserted;
}

export function subscribe(connection: web3.Connection, pool: pg.Pool) {
  return connection.onLogs(PROGRAM_ID, async ({ signature, err }) => {
    if (err) return;
    try {
      const events = await fetchEvents(connection, signature);
      const inserted = await withTransaction(pool, (client) => saveEvents(client, events));
      console.log(`realtime ${signature.slice(0, 8)}… +${inserted}`);
    } catch (error) {
      console.error("realtime lỗi, backfill sẽ bù", error);
    }
  }, "confirmed");
}
