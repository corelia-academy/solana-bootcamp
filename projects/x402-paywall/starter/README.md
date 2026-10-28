# Starter — x402

Types theo spec x402 v2 (`PaymentRequired`, `PaymentRequirements`, `PaymentPayload`, `SettleResponse`) đã có. Hoàn thiện các hàm theo thứ tự TODO.

## Mục tiêu state
Hiểu ba header v2 và hình dạng từng object trước khi viết logic.
## Phần đã có
Types, hằng số network CAIP-2/USDC Devnet và test contract (đang skip).
## Học viên cần làm
TODO 1 encode/decode header base64, TODO 2 `buildPaymentRequired`, TODO 3 `gate` trả 402 và so khớp `accepted`, TODO 4 `SettlementCache`, TODO 5 verify/settle.
## Chạy và kiểm tra
`pnpm install && pnpm run check && pnpm test`
