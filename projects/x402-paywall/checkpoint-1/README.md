# Checkpoint 1 — Challenge

Header base64, 402 challenge và bước so khớp `accepted` với option server đã công bố đã xong.

## Mục tiêu state
Trả challenge đúng spec v2 và chặn payload tự khai giá/người nhận.
## Phần đã có
`encodeHeader`/`decodeHeader`, `buildPaymentRequired`, `gate` bước 1–3.
## Học viên cần làm
`SettlementCache`, gọi `facilitator.verify` rồi `settle`, trả 200 + `PAYMENT-RESPONSE`, 502 retryable khi facilitator lỗi.
## Chạy và kiểm tra
`pnpm install && pnpm run check && pnpm test`
