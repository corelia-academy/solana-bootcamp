# Data Indexing Lab

Lab ingest event Voting theo khóa idempotency `(signature, logIndex)`, giữ checkpoint và cung cấp pagination giới hạn. Dùng fixture local nên không cần RPC/PostgreSQL để học core invariant.

![Indexing flow](../../notes/images/indexing-flow.png)

Bắt đầu tại [starter](./starter/src/indexer.ts), đối chiếu [solution](./solution/src/indexer.ts).

## Tài nguyên sơ đồ

[Mở Mermaid source](../../notes/images/indexing-flow.mmd) để chỉnh sửa sơ đồ.
