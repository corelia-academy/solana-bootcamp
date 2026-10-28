# Final — x402 Paywall

## Mục tiêu state

Lõi x402 v2 tự viết (`src/x402.ts`) có test offline, cộng resource server và paying client thật dùng SDK chính thức trên Solana Devnet.

## Phần đã có

- `src/x402.ts`: challenge, header, so khớp `accepted`, `SettlementCache`, verify/settle qua `FacilitatorPort`;
- `src/server.ts`: `paymentMiddleware` + `x402ResourceServer` + `HTTPFacilitatorClient` + `ExactSvmScheme`;
- `src/client.ts`: `wrapFetchWithPayment` + `registerExactSvmScheme` + signer `@solana/kit`.

## Học viên cần làm

Đối chiếu `gate()` với những gì middleware làm; chạy thử trên Devnet với ví riêng.

## Chạy và kiểm tra

```bash
pnpm install && pnpm run check && pnpm test

# Devnet (cần mạng tới facilitator)
PAY_TO=<ví nhận, đã có USDC ATA> pnpm start:server
PAYER_KEYPAIR=<keypair ví riêng có USDC Devnet> pnpm start:client
```

`FACILITATOR_URL` mặc định là `https://x402.org/facilitator`; đổi sang facilitator khác nếu facilitator này không hỗ trợ Solana Devnet tại thời điểm chạy. USDC Devnet lấy ở faucet của Circle.
