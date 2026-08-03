# Vote Indexer — Checkpoint 2

## Mục tiêu state

Event lưu vào PostgreSQL không trùng, checkpoint không lùi và ghi cùng transaction với event (hết bước 5).

## Phần đã có

Checkpoint 1, thêm `src/db.ts`, `src/migrate.ts`, `src/store.ts`, hai migration trong `db/`, `scripts/migrate.ts` và test store.

## Học viên cần làm

Bước 6–8: backfill từ RPC, REST API, realtime và chạy với validator local.

## Chạy và kiểm tra

```shell
docker run --name vote-indexer-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vote_indexer -p 5433:5432 -d postgres:16
docker exec vote-indexer-db createdb -U postgres vote_indexer_test
cd indexer
cp .env.example .env
pnpm install
pnpm migrate
pnpm test
```

Kết quả: `Migration xong` và `5 passed`.
