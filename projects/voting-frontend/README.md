# Voting Frontend

Project Module 9 dùng lại Voting App Module 6, giữ program interface ổn định và tập trung vào wallet/transaction UX.

![Frontend flow](../../notes/images/frontend-flow.png)

- [Starter](./starter/README.md)
- [Checkpoint 1](./checkpoint-1/README.md)
- [Checkpoint 2](./checkpoint-2/README.md)
- [Final](./final/README.md)

## Giao diện

`VotingClient` cung cấp `listPolls`, `vote`, `confirm`; `WalletPort` cung cấp trạng thái kết nối/public key. Mock mode và Anchor/Devnet adapter phải cùng interface.

## Test matrix

Kiểm thử wallet chưa kết nối, trạng thái load/empty/error, chữ ký bị từ chối, confirmation thất bại, confirm-before-refetch, button pending, state cũ và Explorer URL theo cluster.

## PDA và threat model

Frontend không tạo namespace PDA mới; Anchor adapter derive đúng Poll/Candidate/VoteReceipt của Voting Program. Không tin optimistic state trước confirmation, không hardcode cluster URL và không yêu cầu seed/private key.

## Tài nguyên sơ đồ

[Mở Mermaid source](../../notes/images/frontend-flow.mmd) để chỉnh sửa sơ đồ.
