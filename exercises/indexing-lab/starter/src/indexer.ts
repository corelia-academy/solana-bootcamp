export type VoteEvent = { signature: string; logIndex: number; slot: number; poll: string; voter: string; candidateId: number };
export type Page = { items: VoteEvent[]; nextCursor?: string };
export class VoteEventStore {
  ingest(_event: VoteEvent): "inserted" | "duplicate" { throw new Error("TODO 1: idempotent upsert"); }
  checkpoint(): number { throw new Error("TODO 2: durable checkpoint"); }
  list(_limit = 20, _cursor?: string): Page { throw new Error("TODO 3: bounded pagination"); }
}
