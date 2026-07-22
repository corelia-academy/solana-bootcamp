export type VoteEvent = { signature: string; logIndex: number; slot: number; poll: string; voter: string; candidateId: number };
export type Page = { items: VoteEvent[]; nextCursor?: string };

export class VoteEventStore {
  readonly #events = new Map<string, VoteEvent>();
  #checkpoint = 0;

  ingest(event: VoteEvent): "inserted" | "duplicate" {
    if (!event.signature || event.logIndex < 0 || event.slot < 0) throw new Error("MALFORMED_EVENT");
    const key = `${event.signature}:${event.logIndex}`;
    if (this.#events.has(key)) return "duplicate";
    this.#events.set(key, structuredClone(event));
    this.#checkpoint = Math.max(this.#checkpoint, event.slot);
    return "inserted";
  }

  checkpoint(): number { return this.#checkpoint; }

  list(limit = 20, cursor?: string): Page {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_LIMIT");
    const sorted = [...this.#events.values()].sort((a, b) => a.slot - b.slot || a.logIndex - b.logIndex);
    const start = cursor ? Number.parseInt(cursor, 10) : 0;
    if (!Number.isInteger(start) || start < 0) throw new Error("INVALID_CURSOR");
    const items = sorted.slice(start, start + limit);
    const next = start + items.length;
    return { items, ...(next < sorted.length ? { nextCursor: String(next) } : {}) };
  }
}
