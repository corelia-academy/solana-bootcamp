# Module 15: x402 HTTP-Native Payments

## Kết quả đầu ra

Xây và test API trả phí theo request theo x402 v2 trên Solana Devnet, dùng SDK chính thức và facilitator.

## Bài học

Đọc [nội dung chi tiết từng lesson](./lessons.md).

1. HTTP 402 history
2. Request cycle v2: PAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSE
3. Payment payload fields và so khớp `accepted`
4. USDC settlement và ATA recap
5. Resource server với `@x402/express`
6. Facilitator: verify và settle
7. Paying client với `@x402/fetch`
8. Replay và request đồng thời
9. Wallet-based dApp flow
10. AI-agent payment
11. Failure/security
12. Full server/client tests

Project: [x402 Paywall](../../projects/x402-paywall/README.md). Reference: [x402 flow](../../notes/x402.md).

## Điều kiện tiên quyết

Hoàn thành Module 7 và Module 9.

## Điều hướng

Module trước: [Module 14](../module-14-forecasting/README.md) · Module tiếp theo: [Module 16](../module-16-mcp/README.md) · [Bản đồ phụ thuộc](../../docs/module-dependencies.md)
