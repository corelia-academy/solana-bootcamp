# Module 13: Data Indexing (Optional)

## Kết quả đầu ra

Biến program events thành application data có thể query và hiểu trade-off giữa RPC/indexer.

## Bài học

Đọc [nội dung chi tiết từng lesson](./lessons.md).

1. Why indexing matters and RPC limitations
2. RPC versus indexer
3. Anchor events and logs
4. Geyser concept
5. Carbon and Yellowstone overview
6. Simple event indexer
7. PostgreSQL persistence
8. REST API for frontend

## Sản phẩm nộp

Emit one domain event, ingest it idempotently, store transaction signature/slot, expose a bounded API, and demonstrate reconnect/backfill behavior.

Lab: [Data Indexing starter/solution](../../exercises/indexing-lab/README.md).

## Điều kiện tiên quyết

Hoàn thành Module 5–6; đây là nhánh tự chọn.

## Điều hướng

Module trước: [Module 12](../module-12-privacy-zk/README.md) · Module tiếp theo: [Module 14](../module-14-forecasting/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
