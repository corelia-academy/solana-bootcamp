# Vote Indexer — Code-along từng bước

Bài này thêm event cho Voting program của Module 6, rồi viết một indexer TypeScript từ thư mục trống: decode event từ log, lưu vào PostgreSQL không trùng, backfill theo checkpoint, nghe realtime và mở REST API cho frontend. Mỗi bước gõ một đoạn ngắn rồi type-check hoặc test ngay. Bước cuối ra đúng code [`projects/voting-app/indexer/final`](../../projects/voting-app/indexer/README.md); `checkpoint-1`, `checkpoint-2` và `final` chỉ để đối chiếu.

Cần có project `~/code/bootcamp-labs/voting` đã làm xong theo [code-along Module 6](../module-06-voting/code-along.md), Node 24, pnpm 9 và Docker. Trên Windows, chạy mọi lệnh trong WSL2 và bật WSL integration của Docker Desktop.

```text
~/code/bootcamp-labs/
├── voting/         # Anchor workspace của Module 6, thêm event ở bước 1
└── vote-indexer/   # project Node tạo mới từ bước 2
```

Đường dẫn trong các ghi chú `file:` tính từ `~/code/bootcamp-labs`.

<a id="idx-1"></a>
## Bước 1 — Phát event `VoteCast`

**Khái niệm:** [Anchor events/logs](./lessons.md#133-anchor-eventslogs)

Mọi lệnh của bước này chạy tại `~/code/bootcamp-labs/voting`.

### 1a. Struct event

**Thêm vào cuối `programs/voting/src/lib.rs`:**

<!-- file: voting/programs/voting/src/lib.rs; mode: append -->
```rust

#[event]
pub struct VoteCast {
    pub version: u8,
    pub poll: Pubkey,
    pub candidate: Pubkey,
    pub voter: Pubkey,
    pub candidate_id: u16,
    pub votes: u64,
    pub timestamp: i64,
}
```

Chạy `anchor build`: build được. IDL trong `target/idl/voting.json` có thêm mục `events` với `VoteCast`.

### 1b. Emit trong `vote`

**Chèn ngay sau dòng `receipt.bump = ctx.bumps.vote_receipt;`** trong hàm `vote`:

<!-- file: voting/programs/voting/src/lib.rs; mode: after: receipt.bump = ctx.bumps.vote_receipt; -->
```rust

        emit!(VoteCast {
            version: 1,
            poll: receipt.poll,
            candidate: receipt.candidate,
            voter: receipt.voter,
            candidate_id: candidate.candidate_id,
            votes: candidate.votes,
            timestamp: now,
        });
```

Chạy `anchor build`: build được. `emit!` ghi event thành một dòng log `Program data: <base64>` trong transaction.

### 1c. Test vote bằng ví mới

**Trong `tests/voting.ts`, chèn trước dòng `});` cuối file** (dòng đóng `describe`):

<!-- file: voting/tests/voting.ts; mode: before-last: }); -->
```ts

  it("vote phát event VoteCast", async () => {
    const voter = anchor.web3.Keypair.generate();
    const airdrop = await provider.connection.requestAirdrop(voter.publicKey, 1_000_000_000);
    await provider.connection.confirmTransaction(airdrop, "confirmed");
    const [receipt] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), poll.toBuffer(), voter.publicKey.toBuffer()],
      program.programId,
    );
    const signature = await program.methods
      .vote(pollId, candidateId)
      .accounts({ poll, candidate, voteReceipt: receipt, voter: voter.publicKey })
      .signers([voter])
      .rpc({ commitment: "confirmed" });
  });
```

Chạy `anchor test`: thêm một test passing. Ví của test đã vote ở test trước, nên cần một ví mới có SOL để trả rent cho receipt.

### 1d. Đọc event từ transaction

**Chèn trước dòng `});` đóng test vừa thêm:**

<!-- file: voting/tests/voting.ts; mode: before-last:   }); -->
```ts

    const tx = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const parser = new anchor.EventParser(program.programId, program.coder);
    const events = [...parser.parseLogs(tx!.meta!.logMessages!)];
    expect(events).to.have.length(1);
    expect(events[0].name).to.equal("voteCast");
    expect(events[0].data.voter.equals(voter.publicKey)).to.equal(true);
    expect(events[0].data.votes.toNumber()).to.equal(2);
```

Chạy `anchor test`: test mới vẫn passing. `program.coder` đổi tên sang camelCase nên event tên `voteCast`; `votes` bằng 2 vì ví authority đã vote một phiếu ở test trước.

<a id="idx-2"></a>
## Bước 2 — Tạo project indexer

**Khái niệm:** [Data flow](./lessons.md#data-flow)

### 2a. Thư mục và dependency

```bash
cd ~/code/bootcamp-labs
mkdir vote-indexer
cd vote-indexer
pnpm init
```

**Thay toàn bộ `package.json`:**

<!-- file: vote-indexer/package.json; mode: replace -->
```json
{
  "name": "vote-indexer",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc",
    "test": "vitest run --no-file-parallelism",
    "migrate": "node --env-file=.env scripts/migrate.ts",
    "start": "node --env-file=.env src/main.ts",
    "seed": "node --env-file=.env scripts/seed.ts"
  }
}
```

```bash
pnpm add @anchor-lang/core@1.2.1 pg
pnpm add -D typescript@5.9.3 vitest@^3 @types/node@^24 @types/pg
```

Node 24 chạy thẳng file `.ts` (type stripping), nên không cần bước build. pnpm có thể cảnh báo peer dependency của `ws`; cảnh báo này không ảnh hưởng bài.

### 2b. tsconfig và IDL

**Tạo `tsconfig.json`:**

<!-- file: vote-indexer/tsconfig.json; mode: replace -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "tests"]
}
```

Chép IDL đã build ở bước 1 sang indexer:

```bash
mkdir idl
cp ../voting/target/idl/voting.json idl/
```

IDL là hợp đồng giữa program và indexer: mỗi lần đổi event trong program, build lại và chép lại file này.

<a id="idx-3"></a>
## Bước 3 — Decoder

**Khái niệm:** [Event indexer](./lessons.md#136-event-indexer)

### 3a. Parser và kiểu transaction thô

**Tạo `src/decode.ts`:**

<!-- file: vote-indexer/src/decode.ts; mode: replace -->
```ts
import { BorshCoder, EventParser, web3, type Idl } from "@anchor-lang/core";
import idl from "../idl/voting.json" with { type: "json" };

export const PROGRAM_ID = new web3.PublicKey(idl.address);
const parser = new EventParser(PROGRAM_ID, new BorshCoder(idl as Idl));

export type RawTx = {
  signature: string;
  slot: number;
  blockTime: number | null;
  logs: string[];
};
```

Chạy `pnpm check`: không lỗi.

### 3b. Kiểu `VoteEvent`, phần định danh

**Thêm vào cuối `src/decode.ts`:**

<!-- file: vote-indexer/src/decode.ts; mode: append -->
```ts

export type VoteEvent = {
  signature: string;
  eventIndex: number;
  slot: number;
  blockTime: number | null;
  programId: string;
};
```

### 3c. Hàm `decodeVoteEvents`

**Thêm vào cuối `src/decode.ts`:**

<!-- file: vote-indexer/src/decode.ts; mode: append -->
```ts

export function decodeVoteEvents(tx: RawTx): VoteEvent[] {
  const events: VoteEvent[] = [];
  let eventIndex = 0;
  for (const event of parser.parseLogs(tx.logs)) {
    const index = eventIndex++;
    if (event.name !== "VoteCast") continue;
    events.push({
      signature: tx.signature,
      eventIndex: index,
      slot: tx.slot,
      blockTime: tx.blockTime,
      programId: PROGRAM_ID.toBase58(),
    });
  }
  return events;
}
```

Chạy `pnpm check`: không lỗi. Khóa `(signature, eventIndex)` định danh duy nhất một event: cùng transaction có thể phát nhiều event.

### 3d. Dữ liệu nghiệp vụ

**Chèn sau dòng `programId: string;`** trong kiểu `VoteEvent`:

<!-- file: vote-indexer/src/decode.ts; mode: after: programId: string; -->
```ts
  version: number;
  poll: string;
  candidate: string;
  voter: string;
  candidateId: number;
  votes: string;
```

**Chèn sau dòng `if (event.name !== "VoteCast") continue;`:**

<!-- file: vote-indexer/src/decode.ts; mode: after: if (event.name !== "VoteCast") continue; -->
```ts
    const data = event.data;
```

**Chèn sau dòng `programId: PROGRAM_ID.toBase58(),`:**

<!-- file: vote-indexer/src/decode.ts; mode: after: programId: PROGRAM_ID.toBase58(), -->
```ts
      version: data.version,
      poll: data.poll.toBase58(),
      candidate: data.candidate.toBase58(),
      voter: data.voter.toBase58(),
      candidateId: data.candidate_id,
      votes: data.votes.toString(),
```

Chạy `pnpm check`: không lỗi. `BorshCoder` dùng IDL gốc nên tên field giữ snake_case (`candidate_id`), khác `program.coder` trong test Anchor.

### 3e. Fixture: transaction giả

**Tạo `tests/fixtures.ts`:**

<!-- file: vote-indexer/tests/fixtures.ts; mode: replace -->
```ts
import anchor from "@anchor-lang/core";
import idl from "../idl/voting.json" with { type: "json" };
import type { RawTx } from "../src/decode.ts";

const coder = new anchor.BorshCoder(idl as anchor.Idl);
const discriminator = Buffer.from(idl.events[0].discriminator);

export function voteTx(signature: string, slot: number, ...dataLogs: string[]): RawTx {
  const logs = [
    `Program ${idl.address} invoke [1]`,
    "Program log: Instruction: Vote",
    ...dataLogs,
    `Program ${idl.address} success`,
  ];
  return { signature, slot, blockTime: 1_700_000_000, logs };
}
```

Chạy `pnpm check`: không lỗi.

### 3f. Fixture: dòng log `VoteCast`

**Chèn trước dòng `export function voteTx(`:**

<!-- file: vote-indexer/tests/fixtures.ts; mode: before: export function voteTx(signature: string, slot: number, ...dataLogs: string[]): RawTx { -->
```ts
export const poll = anchor.web3.Keypair.generate().publicKey;
export const candidates = [1, 2].map(() => anchor.web3.Keypair.generate().publicKey);

export function voteLog(candidateId: number, votes: number) {
  const body = coder.types.encode("VoteCast", {
    version: 1,
    poll,
    candidate: candidates[candidateId - 1],
    voter: anchor.web3.Keypair.generate().publicKey,
    candidate_id: candidateId,
    votes: new anchor.BN(votes),
    timestamp: new anchor.BN(1_700_000_000),
  });
  return `Program data: ${Buffer.concat([discriminator, body]).toString("base64")}`;
}

```

Chạy `pnpm check`: không lỗi. Fixture mã hóa event đúng cách `emit!` làm: 8 byte discriminator rồi dữ liệu Borsh, tất cả base64.

### 3g. Test decode một event

**Tạo `tests/decode.test.ts`:**

<!-- file: vote-indexer/tests/decode.test.ts; mode: replace -->
```ts
import { describe, expect, it } from "vitest";
import { decodeVoteEvents } from "../src/decode.ts";
import { candidates, poll, voteLog, voteTx } from "./fixtures.ts";

describe("decodeVoteEvents", () => {
  it("đọc VoteCast từ log của transaction", () => {
    const [event] = decodeVoteEvents(voteTx("sig-1", 10, voteLog(2, 3)));
    expect(event.signature).toBe("sig-1");
    expect(event.eventIndex).toBe(0);
    expect(event.slot).toBe(10);
    expect(event.poll).toBe(poll.toBase58());
    expect(event.candidate).toBe(candidates[1].toBase58());
    expect(event.candidateId).toBe(2);
    expect(event.votes).toBe("3");
  });
});
```

Chạy `pnpm test`: `1 passed`.

### 3h. Test log hỏng

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/decode.test.ts; mode: before-last: }); -->
```ts

  it("bỏ qua log hỏng và giữ thứ tự event", () => {
    const events = decodeVoteEvents(voteTx("sig-2", 11, voteLog(1, 1), "Program data: !!!", voteLog(1, 2)));
    expect(events.map((event) => event.eventIndex)).toEqual([0, 1]);
    expect(events.map((event) => event.votes)).toEqual(["1", "2"]);
  });
```

Chạy `pnpm test`: `2 passed`. Đây là trạng thái `checkpoint-1`.

<a id="idx-4"></a>
## Bước 4 — PostgreSQL và migration

**Khái niệm:** [PostgreSQL](./lessons.md#137-postgresql)

### 4a. Database chạy bằng Docker

```bash
docker run --name vote-indexer-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vote_indexer -p 5433:5432 -d postgres:16
docker exec vote-indexer-db createdb -U postgres vote_indexer_test
```

Port 5433 để không đụng PostgreSQL có sẵn trên máy (thường ở 5432). macOS và Windows cần Docker Desktop đang chạy; trên Linux, user cần thuộc group `docker` hoặc thêm `sudo` trước lệnh. Lần sau chỉ cần `docker start vote-indexer-db`.

**Tạo `.env`:**

<!-- file: vote-indexer/.env; mode: replace -->
```text
DATABASE_URL=postgres://postgres:postgres@localhost:5433/vote_indexer
```

`.env` chứa mật khẩu nên không commit. Test dùng database riêng `vote_indexer_test`.

### 4b. Pool kết nối

**Tạo `src/db.ts`:**

<!-- file: vote-indexer/src/db.ts; mode: replace -->
```ts
import pg from "pg";

// BIGINT (slot, giờ) trả về number thay vì string; an toàn vì nhỏ hơn 2^53.
pg.types.setTypeParser(20, Number);

export function createPool(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return new pg.Pool({ connectionString: url, max: 5 });
}
```

Chạy `pnpm check`: không lỗi.

### 4c. Transaction

**Thêm vào cuối `src/db.ts`:**

<!-- file: vote-indexer/src/db.ts; mode: append -->
```ts

export async function withTransaction<T>(
  pool: pg.Pool,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
```

Chạy `pnpm check`: không lỗi.

### 4d. Bảng ghi migration đã chạy

**Tạo `src/migrate.ts`:**

<!-- file: vote-indexer/src/migrate.ts; mode: replace -->
```ts
import { readdir, readFile } from "node:fs/promises";
import type pg from "pg";
import { withTransaction } from "./db.ts";

const dir = new URL("../db/", import.meta.url);

export async function migrate(pool: pg.Pool) {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
}
```

Chạy `pnpm check`: không lỗi.

### 4e. Chạy từng file migration một lần

**Chèn sau dòng `const files = ...`:**

<!-- file: vote-indexer/src/migrate.ts; mode: after: const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort(); -->
```ts
  for (const name of files) {
    const done = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (done.rowCount) continue;
    const sql = await readFile(new URL(name, dir), "utf8");
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    });
  }
```

Chạy `pnpm check`: không lỗi.

### 4f. Migration đầu tiên: bảng `vote_events`

**Tạo `scripts/migrate.ts`:**

<!-- file: vote-indexer/scripts/migrate.ts; mode: replace -->
```ts
import { createPool } from "../src/db.ts";
import { migrate } from "../src/migrate.ts";

const pool = createPool();
await migrate(pool);
await pool.end();
console.log("Migration xong");
```

**Tạo `db/001_vote_events.sql`:**

<!-- file: vote-indexer/db/001_vote_events.sql; mode: replace -->
```sql
CREATE TABLE vote_events (
  signature    TEXT     NOT NULL,
  event_index  INTEGER  NOT NULL,
  slot         BIGINT   NOT NULL,
  block_time   BIGINT,
  program_id   TEXT     NOT NULL,
  version      SMALLINT NOT NULL,
  poll         TEXT     NOT NULL,
  candidate    TEXT     NOT NULL,
  voter        TEXT     NOT NULL,
  candidate_id INTEGER  NOT NULL,
  votes        BIGINT   NOT NULL,
  PRIMARY KEY (signature, event_index)
);

CREATE INDEX vote_events_by_poll
  ON vote_events (poll, slot DESC, signature DESC, event_index DESC);
```

```bash
pnpm migrate
docker exec vote-indexer-db psql -U postgres -d vote_indexer -c '\dt'
```

Kết quả: in `Migration xong`; danh sách bảng có `schema_migrations` và `vote_events`. Chạy `pnpm migrate` lần nữa vẫn in `Migration xong` và không tạo lại bảng.

### 4g. Migration thứ hai: bảng `checkpoints`

**Tạo `db/002_checkpoints.sql`:**

<!-- file: vote-indexer/db/002_checkpoints.sql; mode: replace -->
```sql
CREATE TABLE checkpoints (
  name      TEXT   PRIMARY KEY,
  signature TEXT   NOT NULL,
  slot      BIGINT NOT NULL
);
```

Chạy `pnpm migrate`: chỉ file `002` được chạy. Migration đã chạy thì không sửa nữa; đổi schema bằng file mới có số lớn hơn.

<a id="idx-5"></a>
## Bước 5 — Lưu idempotent và checkpoint

**Khái niệm:** [Failure model và tests](./lessons.md#failure-model-và-tests)

### 5a. `saveEvents`

**Tạo `src/store.ts`:**

<!-- file: vote-indexer/src/store.ts; mode: replace -->
```ts
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
```

Chạy `pnpm check`: không lỗi.

### 5b. Database cho test

**Tạo `tests/db.ts`:**

<!-- file: vote-indexer/tests/db.ts; mode: replace -->
```ts
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
```

Chạy `pnpm check`: không lỗi.

### 5c. Test nhận trùng

**Tạo `tests/store.test.ts`:**

<!-- file: vote-indexer/tests/store.test.ts; mode: replace -->
```ts
import { describe, expect, it } from "vitest";
import { withTransaction } from "../src/db.ts";
import { decodeVoteEvents } from "../src/decode.ts";
import { saveEvents } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();

describe("store", () => {
  it("nhận trùng một event chỉ lưu một dòng", async () => {
    const events = decodeVoteEvents(voteTx("dup", 20, voteLog(1, 1)));
    const first = await withTransaction(db.pool, (client) => saveEvents(client, events));
    const again = await withTransaction(db.pool, (client) => saveEvents(client, events));
    expect([first, again]).toEqual([1, 0]);
  });
});
```

Chạy `pnpm test`: `3 passed`.

### 5d. Đọc checkpoint

**Thêm vào cuối `src/store.ts`:**

<!-- file: vote-indexer/src/store.ts; mode: append -->
```ts

export const CHECKPOINT = "vote-backfill";

export type Checkpoint = { signature: string; slot: number };

export async function getCheckpoint(pool: pg.Pool, name: string): Promise<Checkpoint | null> {
  const { rows } = await pool.query("SELECT signature, slot FROM checkpoints WHERE name = $1", [name]);
  return rows[0] ?? null;
}
```

Chạy `pnpm check`: không lỗi.

### 5e. Ghi checkpoint, không cho lùi

**Thêm vào cuối `src/store.ts`:**

<!-- file: vote-indexer/src/store.ts; mode: append -->
```ts

export async function setCheckpoint(client: pg.PoolClient, name: string, checkpoint: Checkpoint) {
  await client.query(
    `INSERT INTO checkpoints (name, signature, slot) VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET signature = EXCLUDED.signature, slot = EXCLUDED.slot
     WHERE checkpoints.slot <= EXCLUDED.slot`,
    [name, checkpoint.signature, checkpoint.slot],
  );
}
```

Chạy `pnpm check`: không lỗi.

### 5f. Test checkpoint không lùi

**Trong `tests/store.test.ts`, thay dòng import `saveEvents`:**

<!-- file: vote-indexer/tests/store.test.ts; mode: replace-line: import { saveEvents } from "../src/store.ts"; -->
```ts
import { getCheckpoint, saveEvents, setCheckpoint } from "../src/store.ts";
```

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/store.test.ts; mode: before-last: }); -->
```ts

  it("checkpoint không lùi khi slot cũ đến sau", async () => {
    await withTransaction(db.pool, (client) => setCheckpoint(client, "test", { signature: "b", slot: 30 }));
    await withTransaction(db.pool, (client) => setCheckpoint(client, "test", { signature: "a", slot: 25 }));
    expect(await getCheckpoint(db.pool, "test")).toEqual({ signature: "b", slot: 30 });
  });
```

Chạy `pnpm test`: `4 passed`.

### 5g. Test lỗi giữa chừng

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/store.test.ts; mode: before-last: }); -->
```ts

  it("lỗi giữa chừng thì không lưu event lẫn checkpoint", async () => {
    const events = decodeVoteEvents(voteTx("rollback", 40, voteLog(1, 1)));
    const work = withTransaction(db.pool, async (client) => {
      await saveEvents(client, events);
      await setCheckpoint(client, "rollback", { signature: "rollback", slot: 40 });
      throw new Error("RPC timeout");
    });
    await expect(work).rejects.toThrow("RPC timeout");
    expect(await getCheckpoint(db.pool, "rollback")).toBeNull();
    const { rows } = await db.pool.query("SELECT count(*) AS n FROM vote_events WHERE signature = 'rollback'");
    expect(rows[0].n).toBe(0);
  });
```

Chạy `pnpm test`: `5 passed`. Đây là trạng thái `checkpoint-2`.

<a id="idx-6"></a>
## Bước 6 — Backfill từ RPC

**Khái niệm:** [RPC và indexer](./lessons.md#132-rpc-và-indexer) · [Data flow](./lessons.md#data-flow)

### 6a. Lấy event của một transaction

**Tạo `src/ingest.ts`:**

<!-- file: vote-indexer/src/ingest.ts; mode: replace -->
```ts
import { web3 } from "@anchor-lang/core";
import { decodeVoteEvents } from "./decode.ts";

export async function fetchEvents(connection: web3.Connection, signature: string) {
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || tx.meta?.err || !tx.meta?.logMessages) return [];
  return decodeVoteEvents({ signature, slot: tx.slot, blockTime: tx.blockTime ?? null, logs: tx.meta.logMessages });
}
```

Chạy `pnpm check`: không lỗi.

### 6b. Danh sách signature mới

**Trong `src/ingest.ts`, thay dòng import `decodeVoteEvents`:**

<!-- file: vote-indexer/src/ingest.ts; mode: replace-line: import { decodeVoteEvents } from "./decode.ts"; -->
```ts
import { decodeVoteEvents, PROGRAM_ID } from "./decode.ts";
```

**Thêm vào cuối file:**

<!-- file: vote-indexer/src/ingest.ts; mode: append -->
```ts

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
```

Chạy `pnpm check`: không lỗi. RPC trả signature mới nhất trước, mỗi trang tối đa 1000; `until` dừng lại ở checkpoint.

### 6c. `backfill`

**Chèn sau dòng `import { web3 } from "@anchor-lang/core";`:**

<!-- file: vote-indexer/src/ingest.ts; mode: after: import { web3 } from "@anchor-lang/core"; -->
```ts
import type pg from "pg";
import { withTransaction } from "./db.ts";
```

**Chèn sau dòng import từ `./decode.ts`:**

<!-- file: vote-indexer/src/ingest.ts; mode: after: import { decodeVoteEvents, PROGRAM_ID } from "./decode.ts"; -->
```ts
import { CHECKPOINT, getCheckpoint, saveEvents, setCheckpoint } from "./store.ts";
```

**Thêm vào cuối file:**

<!-- file: vote-indexer/src/ingest.ts; mode: append -->
```ts

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
```

Chạy `pnpm check`: không lỗi. Event và checkpoint ghi trong cùng một transaction: checkpoint chỉ tiến khi event đã lưu.

### 6d. Chain giả cho test

**Tạo `tests/fake-chain.ts`:**

<!-- file: vote-indexer/tests/fake-chain.ts; mode: replace -->
```ts
import type { web3 } from "@anchor-lang/core";
import type { RawTx } from "../src/decode.ts";

export class FakeChain {
  txs: (RawTx & { err: unknown })[] = [];

  add(tx: RawTx, err: unknown = null) {
    this.txs.push({ ...tx, err });
  }

  asConnection() {
    return this as unknown as web3.Connection;
  }
}
```

Chạy `pnpm check`: không lỗi.

### 6e. Hai hàm RPC giả

**Chèn trước dòng `export class FakeChain {`:**

<!-- file: vote-indexer/tests/fake-chain.ts; mode: before: export class FakeChain { -->
```ts
type Opts = { before?: string; until?: string; limit?: number };

```

**Chèn trước dòng `asConnection() {`:**

<!-- file: vote-indexer/tests/fake-chain.ts; mode: before: asConnection() { -->
```ts
  async getSignaturesForAddress(_address: unknown, { before, until, limit = 1000 }: Opts) {
    let newestFirst = [...this.txs].reverse();
    const at = (signature?: string) => newestFirst.findIndex((t) => t.signature === signature);
    if (at(before) >= 0) newestFirst = newestFirst.slice(at(before) + 1);
    if (at(until) >= 0) newestFirst = newestFirst.slice(0, at(until));
    return newestFirst.slice(0, limit).map((t) => ({ signature: t.signature, slot: t.slot, err: t.err }));
  }

  async getTransaction(signature: string) {
    const tx = this.txs.find((t) => t.signature === signature);
    return tx && { slot: tx.slot, blockTime: tx.blockTime, meta: { err: tx.err, logMessages: tx.logs } };
  }

```

Chạy `pnpm check`: không lỗi.

### 6f. Test backfill bỏ transaction lỗi

**Tạo `tests/ingest.test.ts`:**

<!-- file: vote-indexer/tests/ingest.test.ts; mode: replace -->
```ts
import { describe, expect, it } from "vitest";
import { backfill } from "../src/ingest.ts";
import { CHECKPOINT, getCheckpoint } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { FakeChain } from "./fake-chain.ts";
import { voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();

describe("backfill", () => {
  it("chỉ lấy transaction mới sau checkpoint và bỏ transaction lỗi", async () => {
    const chain = new FakeChain();
    chain.add(voteTx("a1", 100, voteLog(1, 1)));
    chain.add(voteTx("a2", 101, voteLog(2, 1)), { InstructionError: [0, "Custom"] });
    expect(await backfill(chain.asConnection(), db.pool)).toBe(1);
    expect(await getCheckpoint(db.pool, CHECKPOINT)).toEqual({ signature: "a2", slot: 101 });
  });
});
```

Chạy `pnpm test`: `6 passed`.

### 6g. Chạy lại chỉ lấy phần mới

**Chèn sau dòng `expect(await getCheckpoint(db.pool, CHECKPOINT))...`:**

<!-- file: vote-indexer/tests/ingest.test.ts; mode: after: expect(await getCheckpoint(db.pool, CHECKPOINT)).toEqual({ signature: "a2", slot: 101 }); -->
```ts

    chain.add(voteTx("a3", 102, voteLog(2, 2)));
    expect(await backfill(chain.asConnection(), db.pool)).toBe(1);
    expect(await backfill(chain.asConnection(), db.pool)).toBe(0);
```

Chạy `pnpm test`: `6 passed`.

### 6h. Test realtime và backfill chồng lấn

**Thay hai dòng import đầu từ `../src/`** (dòng `backfill` và dòng `CHECKPOINT`) bằng:

<!-- file: vote-indexer/tests/ingest.test.ts; mode: replace-line: import { backfill } from "../src/ingest.ts"; -->
```ts
import { withTransaction } from "../src/db.ts";
import { backfill, fetchEvents } from "../src/ingest.ts";
```

<!-- file: vote-indexer/tests/ingest.test.ts; mode: replace-line: import { CHECKPOINT, getCheckpoint } from "../src/store.ts"; -->
```ts
import { CHECKPOINT, getCheckpoint, saveEvents } from "../src/store.ts";
```

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/ingest.test.ts; mode: before-last: }); -->
```ts

  it("event realtime đã lưu thì backfill chồng lấn không tạo bản trùng", async () => {
    const chain = new FakeChain();
    chain.add(voteTx("b1", 200, voteLog(1, 1)));
    const live = await fetchEvents(chain.asConnection(), "b1");
    await withTransaction(db.pool, (client) => saveEvents(client, live));
    expect(await backfill(chain.asConnection(), db.pool)).toBe(0);
  });
```

Chạy `pnpm test`: `7 passed`.

<a id="idx-7"></a>
## Bước 7 — REST API cho frontend

**Khái niệm:** [REST API](./lessons.md#138-rest-api)

### 7a. Độ mới của dữ liệu

**Tạo `src/queries.ts`:**

<!-- file: vote-indexer/src/queries.ts; mode: replace -->
```ts
import type pg from "pg";
import { CHECKPOINT } from "./store.ts";

export async function indexedSlot(pool: pg.Pool) {
  const { rows } = await pool.query("SELECT slot FROM checkpoints WHERE name = $1", [CHECKPOINT]);
  return rows[0]?.slot ?? null;
}
```

Chạy `pnpm check`: không lỗi.

### 7b. Leaderboard

**Thêm vào cuối `src/queries.ts`:**

<!-- file: vote-indexer/src/queries.ts; mode: append -->
```ts

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
```

Chạy `pnpm check`: không lỗi.

### 7c. Danh sách phiếu theo trang

**Thêm vào cuối `src/queries.ts`:**

<!-- file: vote-indexer/src/queries.ts; mode: append -->
```ts

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
```

Chạy `pnpm check`: không lỗi.

### 7d. Trả JSON

**Tạo `src/api.ts`:**

<!-- file: vote-indexer/src/api.ts; mode: replace -->
```ts
import { createServer, type ServerResponse } from "node:http";
import type pg from "pg";
import { indexedSlot, leaderboard, listVotes, type Cursor } from "./queries.ts";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
```

Chạy `pnpm check`: không lỗi.

### 7e. Route và kiểm tra đầu vào

**Thêm vào cuối `src/api.ts`:**

<!-- file: vote-indexer/src/api.ts; mode: append -->
```ts

export function createApi(pool: pg.Pool) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const route = url.pathname.match(/^\/polls\/([^/]+)\/(leaderboard|votes)$/);
    if (req.method !== "GET" || !route) return send(res, 404, { error: "NOT_FOUND" });
    const [, poll, view] = route;
    if (!ADDRESS.test(poll)) return send(res, 400, { error: "INVALID_POLL" });
    try {
    } catch (error) {
      console.error(error);
      return send(res, 500, { error: "INTERNAL" });
    }
  });
}
```

Chạy `pnpm check`: không lỗi.

### 7f. Trả leaderboard

**Chèn sau dòng `try {`:**

<!-- file: vote-indexer/src/api.ts; mode: after: try { -->
```ts
      const freshness = { indexedSlot: await indexedSlot(pool) };
      if (view === "leaderboard") {
        return send(res, 200, { ...freshness, items: await leaderboard(pool, poll) });
      }
```

Chạy `pnpm check`: không lỗi.

### 7g. Trả danh sách phiếu có giới hạn

**Chèn trước dòng `} catch (error) {`:**

<!-- file: vote-indexer/src/api.ts; mode: before: } catch (error) { -->
```ts
      const limit = Number(url.searchParams.get("limit") ?? "20");
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) return send(res, 400, { error: "INVALID_LIMIT" });
      const items = await listVotes(pool, poll, limit);
      const last = items.at(-1);
      const nextCursor = items.length === limit && last ? `${last.slot}:${last.signature}:${last.eventIndex}` : null;
      return send(res, 200, { ...freshness, items, nextCursor });
```

Chạy `pnpm check`: không lỗi.

### 7h. Đọc cursor

**Chèn trước dòng `export function createApi(pool: pg.Pool) {`:**

<!-- file: vote-indexer/src/api.ts; mode: before: export function createApi(pool: pg.Pool) { -->
```ts
function parseCursor(raw: string | null): Cursor | undefined | "invalid" {
  if (raw === null) return undefined;
  const match = raw.match(/^(\d+):([1-9A-HJ-NP-Za-km-z]+):(\d+)$/);
  if (!match) return "invalid";
  return { slot: Number(match[1]), signature: match[2], eventIndex: Number(match[3]) };
}

```

**Thay dòng `const items = await listVotes(pool, poll, limit);` bằng:**

<!-- file: vote-indexer/src/api.ts; mode: replace-line: const items = await listVotes(pool, poll, limit); -->
```ts
      const cursor = parseCursor(url.searchParams.get("cursor"));
      if (cursor === "invalid") return send(res, 400, { error: "INVALID_CURSOR" });
      const items = await listVotes(pool, poll, limit, cursor);
```

Chạy `pnpm check`: không lỗi.

### 7i. Khung test API

**Tạo `tests/api.test.ts`:**

<!-- file: vote-indexer/tests/api.test.ts; mode: replace -->
```ts
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "../src/api.ts";
import { withTransaction } from "../src/db.ts";
import { decodeVoteEvents } from "../src/decode.ts";
import { CHECKPOINT, saveEvents, setCheckpoint } from "../src/store.ts";
import { useTestPool } from "./db.ts";
import { candidates, poll, voteLog, voteTx } from "./fixtures.ts";

const db = useTestPool();
let server: Server;
let base: string;
```

Chạy `pnpm check`: không lỗi.

### 7j. Dữ liệu mẫu và server

**Thêm vào cuối `tests/api.test.ts`:**

<!-- file: vote-indexer/tests/api.test.ts; mode: append -->
```ts

beforeAll(async () => {
  const txs = [voteTx("s1", 1, voteLog(1, 1)), voteTx("s2", 2, voteLog(2, 1)), voteTx("s3", 3, voteLog(2, 2))];
  await withTransaction(db.pool, async (client) => {
    for (const tx of txs) await saveEvents(client, decodeVoteEvents(tx));
    await setCheckpoint(client, CHECKPOINT, { signature: "s3", slot: 3 });
  });
  server = createApi(db.pool).listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}/polls/${poll.toBase58()}`;
});
afterAll(() => {
  server.close();
});
```

Chạy `pnpm check`: không lỗi.

### 7k. Test leaderboard

**Thêm vào cuối `tests/api.test.ts`:**

<!-- file: vote-indexer/tests/api.test.ts; mode: append -->
```ts

describe("REST API", () => {
  it("leaderboard xếp theo số phiếu và báo indexedSlot", async () => {
    const body = await (await fetch(`${base}/leaderboard`)).json();
    expect(body.indexedSlot).toBe(3);
    expect(body.items).toEqual([
      { candidate: candidates[1].toBase58(), candidateId: 2, votes: 2 },
      { candidate: candidates[0].toBase58(), candidateId: 1, votes: 1 },
    ]);
  });
});
```

Chạy `pnpm test`: `8 passed`.

### 7l. Test phân trang

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/api.test.ts; mode: before-last: }); -->
```ts

  it("phân trang votes bằng cursor, mới nhất trước", async () => {
    const first = await (await fetch(`${base}/votes?limit=2`)).json();
    expect(first.items.map((vote: { slot: number }) => vote.slot)).toEqual([3, 2]);
    const second = await (await fetch(`${base}/votes?limit=2&cursor=${first.nextCursor}`)).json();
    expect(second.items.map((vote: { slot: number }) => vote.slot)).toEqual([1]);
    expect(second.nextCursor).toBeNull();
  });
```

Chạy `pnpm test`: `9 passed`.

### 7m. Test đầu vào sai

**Chèn trước dòng `});` cuối file:**

<!-- file: vote-indexer/tests/api.test.ts; mode: before-last: }); -->
```ts

  it("từ chối limit, cursor và poll không hợp lệ", async () => {
    expect((await fetch(`${base}/votes?limit=101`)).status).toBe(400);
    expect((await fetch(`${base}/votes?cursor=abc`)).status).toBe(400);
    expect((await fetch(`${base.replace(poll.toBase58(), "khong-hop-le")}/votes`)).status).toBe(400);
  });
```

Chạy `pnpm test`: `10 passed`.

<a id="idx-8"></a>
## Bước 8 — Chạy với validator local

**Khái niệm:** [Geyser](./lessons.md#134-geyser) · [Failure model và tests](./lessons.md#failure-model-và-tests)

### 8a. Validator local và deploy

Mở terminal thứ hai, chạy validator (giữ terminal này mở):

```bash
solana-test-validator --reset
```

Ở terminal đầu, trong `~/code/bootcamp-labs/voting`:

```bash
solana airdrop 20 -u localhost
solana program deploy target/deploy/voting.so --program-id target/deploy/voting-keypair.json -u localhost
```

`anchor test` tự bật rồi tắt Surfpool sau khi test xong, nên indexer cần một validator chạy lâu. `solana-test-validator` có sẵn trong Solana CLI 4.1.2 và hỗ trợ đủ `getSignaturesForAddress` lẫn `logsSubscribe`. Ví học tập dùng chung cho localnet và Devnet; lệnh airdrop chỉ cấp SOL trên localnet.

### 8b. Nghe realtime

**Thêm vào cuối `vote-indexer/src/ingest.ts`:**

<!-- file: vote-indexer/src/ingest.ts; mode: append -->
```ts

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
```

Chạy `pnpm check`: không lỗi. Realtime không đụng checkpoint: chỉ backfill, đi theo thứ tự lịch sử, mới được tiến checkpoint.

### 8c. Chương trình chính

**Tạo `src/main.ts`:**

<!-- file: vote-indexer/src/main.ts; mode: replace -->
```ts
import { web3 } from "@anchor-lang/core";
import { createApi } from "./api.ts";
import { createPool } from "./db.ts";
import { backfill, subscribe } from "./ingest.ts";
import { migrate } from "./migrate.ts";

const pool = createPool();
await migrate(pool);
const connection = new web3.Connection(process.env.RPC_URL ?? "http://127.0.0.1:8899", "confirmed");

subscribe(connection, pool);
const port = Number(process.env.PORT ?? "3000");
createApi(pool).listen(port, () => console.log(`API: http://localhost:${port}`));
```

Chạy `pnpm start`: in `API: http://localhost:3000`. Nhấn Ctrl+C để dừng.

### 8d. Vòng backfill

**Thêm vào cuối `src/main.ts`:**

<!-- file: vote-indexer/src/main.ts; mode: append -->
```ts

for (;;) {
  try {
    const inserted = await backfill(connection, pool);
    if (inserted > 0) console.log(`backfill +${inserted}`);
  } catch (error) {
    console.error("backfill lỗi, thử lại sau 10 giây", error);
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}
```

Chạy `pnpm start` và để chạy. Localnet mới chưa có phiếu nào nên chỉ in dòng `API:`.

### 8e. Script tạo dữ liệu: kết nối

**Tạo `scripts/seed.ts`:**

<!-- file: vote-indexer/scripts/seed.ts; mode: replace -->
```ts
import anchor from "@anchor-lang/core";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import idl from "../idl/voting.json" with { type: "json" };

const { BN, web3 } = anchor;
const connection = new web3.Connection(process.env.RPC_URL ?? "http://127.0.0.1:8899", "confirmed");
const walletPath = (process.env.ANCHOR_WALLET ?? "~/.config/solana/bootcamp-devnet.json").replace("~", homedir());
const payer = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), { commitment: "confirmed" });
const program = new anchor.Program(idl as anchor.Idl, provider);
```

Chạy `pnpm check`: không lỗi.

### 8f. Tạo poll và candidate

**Thêm vào cuối `scripts/seed.ts`:**

<!-- file: vote-indexer/scripts/seed.ts; mode: append -->
```ts

const pollId = new BN(Date.now());
const now = Math.floor(Date.now() / 1000);
const [poll] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("poll"), payer.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
  program.programId,
);
await program.methods
  .initializePoll(pollId, "Ngôn ngữ yêu thích", new BN(now + 3), new BN(now + 3600))
  .accounts({ authority: payer.publicKey })
  .rpc();
for (const [id, name] of [[1, "Rust"], [2, "TypeScript"]] as const) {
  await program.methods.addCandidate(pollId, id, name).accounts({ poll, authority: payer.publicKey }).rpc();
}
```

Chạy `pnpm check`: không lỗi.

### 8g. Vote bằng nhiều ví

**Thêm vào cuối `scripts/seed.ts`:**

<!-- file: vote-indexer/scripts/seed.ts; mode: append -->
```ts

await new Promise((resolve) => setTimeout(resolve, 4000));
const count = Number(process.env.VOTES ?? "5");
for (let i = 0; i < count; i++) {
  const voter = web3.Keypair.generate();
  const airdrop = await connection.requestAirdrop(voter.publicKey, web3.LAMPORTS_PER_SOL / 10);
  await connection.confirmTransaction(airdrop, "confirmed");
  const candidateId = i % 3 === 2 ? 2 : 1;
  await program.methods.vote(pollId, candidateId).accounts({ poll, voter: voter.publicKey }).signers([voter]).rpc();
}
console.log(`Poll ${poll.toBase58()}: ${count} phiếu`);
```

Mở terminal thứ ba trong `vote-indexer`, indexer vẫn chạy ở terminal đầu:

```bash
pnpm seed
curl -s http://localhost:3000/polls/<POLL>/leaderboard
curl -s "http://localhost:3000/polls/<POLL>/votes?limit=2"
```

Thay `<POLL>` bằng địa chỉ seed in ra. Terminal indexer in năm dòng `realtime … +1`. Leaderboard: Rust 4 phiếu, TypeScript 1 phiếu, kèm `indexedSlot`. Danh sách votes có 2 phiếu mới nhất và `nextCursor`.

### 8h. Tắt indexer rồi bật lại

1. Ở terminal indexer, nhấn Ctrl+C.
2. Ở terminal thứ ba: `VOTES=3 pnpm seed` (PowerShell không dùng được cú pháp này; trên Windows chạy trong WSL).
3. Ở terminal indexer: `pnpm start`. Sau vài giây in `backfill +3`.
4. Gọi lại leaderboard của poll mới: 2 phiếu Rust, 1 phiếu TypeScript.

Ba phiếu được tạo lúc indexer tắt nên realtime bỏ lỡ; backfill đi từ checkpoint và bù đủ, không tạo bản trùng với phiếu đã có. Code giờ giống [`projects/voting-app/indexer/final`](../../projects/voting-app/indexer/final/README.md).

Lưu ý: `solana-test-validator` chỉ giữ lịch sử gần đây (xem `solana first-available-block -u localhost`). Indexer tắt quá lâu thì RPC không còn transaction cũ để backfill, nên production cần RPC giữ lịch sử đủ dài hoặc nguồn stream như Geyser.
