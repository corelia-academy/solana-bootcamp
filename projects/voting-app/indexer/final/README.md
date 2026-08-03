# Vote Indexer — Final

## Mục tiêu state

Voting program phát `VoteCast`; indexer backfill theo checkpoint, nghe realtime, lưu PostgreSQL không trùng và mở REST API có phân trang giới hạn.

## Phần đã có

- `voting/`: Voting App của Module 6, thêm event `VoteCast` và test đọc event.
- `indexer/`: decoder, migration, store, ingest (backfill + realtime), REST API, script seed và 10 test.

## Học viên cần làm

Đối chiếu với bài gõ theo [code-along Module 13](../../../../curriculum/module-13-indexing/code-along.md) sau khi tự làm xong.

## Chạy và kiểm tra

Program:

```shell
cd voting
pnpm install
anchor keys sync
anchor build
anchor test
```

Indexer, với PostgreSQL Docker như [checkpoint-2](../checkpoint-2/README.md):

```shell
cd indexer
cp .env.example .env
pnpm install
pnpm test
```

Chạy thật: `solana-test-validator --reset` ở terminal riêng, deploy `voting` bằng `solana program deploy target/deploy/voting.so --program-id target/deploy/voting-keypair.json -u localhost`, chép IDL mới vào `indexer/idl/`, rồi `pnpm start` và `pnpm seed`.
