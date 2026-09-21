# Vote Indexer — Checkpoint 1

## Mục tiêu state

Indexer decode được event `VoteCast` từ log của transaction (hết bước 3 của code-along).

## Phần đã có

`indexer/`: `package.json`, `tsconfig.json`, IDL, `src/decode.ts`, fixture và test decode. Thay đổi program (bước 1) nằm trong [`final/voting`](../final/voting/README.md).

## Học viên cần làm

Bước 4–5: PostgreSQL, migration, lưu idempotent và checkpoint.

## Chạy và kiểm tra

```shell
cd indexer
pnpm install
pnpm check
pnpm test
```

Kết quả: `2 passed`. IDL trong `idl/voting.json` dùng Program ID mẫu; với program của bạn, chép lại từ `voting/target/idl/voting.json`.
