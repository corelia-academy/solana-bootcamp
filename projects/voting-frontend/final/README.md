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

### Mock mode và Anchor mode

- **Mock mode** (mặc định): chưa có `src/idl/voting.json` thì app dùng `MockVotingClient`, không cần validator hay wallet.
- **Anchor mode**: build Voting App Module 6 (`anchor build`), deploy lên Devnet, rồi copy `target/idl/voting.json` vào `src/idl/voting.json`. App tự chuyển sang `createAnchorVotingClient` với `AnchorProvider` từ wallet đang kết nối.

```bash
cp ../../voting-app/final/target/idl/voting.json src/idl/voting.json
VITE_RPC_URL=https://api.devnet.solana.com pnpm dev   # hoặc http://127.0.0.1:8899 cho localnet
VITE_USE_MOCK=true pnpm dev                            # ép mock mode dù đã có IDL
```

Ở Anchor mode, `Poll.id` là địa chỉ Poll account, vì Poll PDA gồm `authority` + `poll_id`. Program ID lấy từ field `address` trong IDL.
