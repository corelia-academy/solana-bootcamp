# Final — Voting Frontend

## Mục tiêu state

React/Vite frontend có mock mode, typed client interface, transaction state machine, confirmation-before-refetch và cluster-correct Explorer links.

## Phần đã có

React UI, Wallet Adapter boundary, mock/Anchor adapters và frontend tests.

## Học viên cần làm

Đối chiếu error/pending states và thử mock mode trước khi cấu hình Devnet.

## Chạy và kiểm tra

```bash
pnpm install
pnpm test
pnpm run build
pnpm dev
```

Mock mode không cần validator. `src/anchor-client.ts` là adapter Devnet dùng IDL/program ID và đúng Poll/Candidate/VoteReceipt PDA của Voting App Module 6; bootstrap production truyền Anchor Program có wallet provider vào adapter này.
