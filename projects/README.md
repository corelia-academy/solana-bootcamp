# Project thực hành theo từng bước

| Project | Khái niệm chính | Đầu ra |
| --- | --- | --- |
| [PDA Counter](./pda-counter/README.md) | Anchor state, PDA, constraints | Per-user counter |
| [Voting App](./voting-app/README.md) | Multiple PDAs, time, receipts | Tested voting program |
| [Voting Frontend](./voting-app/frontend/README.md) | Wallet, confirmation, refetch | Voting client UI |
| [Vote Indexer](./voting-app/indexer/README.md) | Events, idempotent ingest, checkpoint | Event indexer và REST API |
| [SPL Token Basics](./token-basics/README.md) | Mint, ATA, authorities | Token operation labs |
| [Escrow](./escrow/README.md) | CPI, vault PDA, atomic settlement | Token escrow |
| [Stablecoin Lite](./stablecoin-lite/README.md) | Roles, pause, allowance | Admin token protocol |
| [Simple AMM](./simple-amm/README.md) | Vaults, LP shares, swap math | Constant-product pool |
| [Forecasting App](./forecasting-app/README.md) | State machine, fake points, claim receipt | Prediction app dùng điểm giả lập |
| [Private Note](./private-note/README.md) | Commitment, nullifier, Noir proof, verifier CPI | Ba tầng relation/circuit/boundary |
| [x402 Paywall](./x402-paywall/README.md) | HTTP payments, replay safety | Gated API |
| [MCP Solana Server](./mcp-solana-server/README.md) | Structured AI tools | Safe Solana tool server |
| [AI Agent](./ai-agent-solana/README.md) | Agent loop, limits, audit log | Guarded Devnet agent |
| [Secure Treasury](./secure-treasury/README.md) | Validation, PDA, duplicate signers, kill switch, retry | Hardened 2-of-3 SOL treasury |

## Bốn trạng thái của project

Mỗi project gồm `starter`, `checkpoint-1`, `checkpoint-2` và `final`. Bắt đầu tại `starter`; chỉ dùng checkpoint để phục hồi khi bị kẹt và mở `final` sau khi đã hoàn thành bài. Các TODO và test được skip trong starter là có chủ ý theo tiến độ học.

## Artifact kỹ thuật và hình ảnh bắt buộc

Mỗi project hoàn chỉnh phải có:

1. sơ đồ quan hệ account;
2. instruction flow;
3. sơ đồ derive PDA hoặc lý do rõ ràng khi không dùng PDA;
4. account table gồm signer/writable/owner;
5. frontend-to-program flow hoặc client/CLI flow;
6. test matrix happy/error paths;
7. security assumptions và known limitations.

README của project chứa product schema và liên kết tới các artifact tương ứng.

Quay lại [chương trình học](../curriculum/README.md) hoặc [trang chính](../README.md).
