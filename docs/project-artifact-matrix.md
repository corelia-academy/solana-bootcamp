# Ma trận artifact của project

| Project | State/API schema | PDA/account flow | Client flow | Test/threat model |
| --- | --- | --- | --- | --- |
| PDA Counter | [README](../projects/pda-counter/README.md) | Counter PDA theo owner | Anchor TS tests/client | owner, seeds, overflow/underflow |
| Voting App | [README](../projects/voting-app/README.md) | Poll/Candidate/Receipt PDAs | Voting Frontend | authority, time, duplicate vote |
| SPL Token | [README](../projects/token-basics/README.md) | Mint/ATA, không có custom PDA | TypeScript client | mint/owner/decimals/supply |
| Escrow | [README](../projects/escrow/README.md) | Escrow PDA + vault ATA | CPI/client flow | substitution, donation, replay |
| Voting Frontend | [README](../projects/voting-frontend/README.md) | Dùng PDAs của Voting, không tạo PDA | wallet → confirm → refetch | rejection, stale state, cluster |
| Stablecoin Lite | [README](../projects/stablecoin-lite/README.md) | Config/Allowance PDAs | Admin/minter client | role, pause, allowance, cap |
| Simple AMM | [README](../projects/simple-amm/README.md) | Pool PDA, vaults, LP mint | Liquidity/swap client | rounding, slippage, wrong vault |
| x402 | [README](../projects/x402-paywall/README.md) | Không cần custom PDA trong mock verifier | HTTP challenge/payment/retry | exact payment, expiry, replay |
| MCP Server | [README](../projects/mcp-solana-server/README.md) | Không tạo PDA; RPC đọc state có sẵn | MCP host/tool transport | auth, allowlist, cap, simulation |
| AI Agent | [README](../projects/ai-agent-solana/README.md) | AuditPort; onchain PDA là adapter mở rộng | observe → policy → execute | injection, stale, drain, duplicate |

## Quy tắc audit

- “Không có PDA” phải có lý do kiến trúc, không để trống artifact.
- Mỗi write path phải chỉ ra signer/authority, mutable state và external program/service được gọi.
- Diagram source và ảnh publishable nằm trong `notes/images/`; README project nhúng ảnh tương ứng.
- Test matrix phải có happy path, authorization, relationship/input mismatch và boundary/replay phù hợp.
