# Final — x402 Paywall core

## Mục tiêu state

Mock/local verifier kiểm tra network, asset, base-unit amount, recipient, memo/nonce, expiry, confirmation và single use. RPC timeout retryable không consume nonce.

## Phần đã có

Challenge, verifier, replay store và concurrency coverage.

## Học viên cần làm

Đối chiếu exact-payment và retry behavior; production RPC là adapter mở rộng.

## Chạy và kiểm tra

```bash
pnpm install && pnpm run check && pnpm test
```
