# Checkpoint 2 — Verify và settle

Lõi resource server hoàn chỉnh: verify/settle qua `FacilitatorPort`, chống settle trùng, request đồng thời và timeout.

## Mục tiêu state
Chỉ trả nội dung sau khi facilitator settle thành công, mỗi payload một lần.
## Phần đã có
`gate` đầy đủ, `SettlementCache` có TTL, test offline.
## Học viên cần làm
Nối lõi với SDK chính thức: server `@x402/express`, client `@x402/fetch`, chạy trên Devnet.
## Chạy và kiểm tra
`pnpm install && pnpm run check && pnpm test`
