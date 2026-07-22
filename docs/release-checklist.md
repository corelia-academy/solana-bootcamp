# Release checklist cho khóa quay sẵn

Checklist này dùng trước khi instructor thu hình hoặc phát hành một release candidate. Đây là kiểm tra artifact học viên, không phải giáo án nội bộ.

## Đồng bộ nội dung

- [ ] Đúng 18 module; Module 12–14 được ghi là ba nhánh độc lập.
- [ ] Mỗi module có prerequisite, kết quả đầu ra, lesson, project/lab, definition of done và điều hướng.
- [ ] Tên state, PDA seed, instruction/API và error trong lesson trùng với code final.
- [ ] Video không gọi artifact chưa tồn tại; phần preview/mở rộng được ghi rõ.
- [ ] Mỗi project root có schema, authority/trust boundary, threat model, test matrix và diagram.

## Dry-run bắt buộc

- [ ] Module 5: PDA Counter test lab chạy từ starter và học viên phân biệt logic/constraint/integration test.
- [ ] Module 9: wallet disconnect, reject signature, failed confirmation, refetch và Explorer URL đúng cluster.
- [ ] Module 10: Stablecoin integration test gồm role, pause, allowance/cap và burn.
- [ ] Module 11: AMM integration test gồm liquidity, swap, slippage và account mismatch.
- [ ] Module 15: x402 exact payment, expiry, replay, timeout và concurrent retry.
- [ ] Module 16: MCP read/write tools qua mock RPC, policy trước write và simulation.
- [ ] Module 17: deterministic proposal/policy/execution loop, approval, session cap, kill switch và audit log.

## Clean-clone validation

- [ ] Dùng Rust 1.87.0, Solana CLI 3.0.10, Anchor 0.31.1, Node 22 LTS và pnpm 9.
- [ ] Không dùng wallet mainnet; không có keypair, `.env`, `node_modules`, `target` hoặc `dist` trong Git.
- [ ] Chạy đúng command được ghi trong từng README; không cần đoán working directory.
- [ ] Rust/Anchor final: `cargo fmt --check`, `cargo check`, `anchor test`.
- [ ] TypeScript final: install, type-check/test và build nếu có frontend.
- [ ] Link nội bộ, JSON, whitespace và diagram source/PNG đều hợp lệ.

Chạy `./scripts/validate-release.sh` cho content audit và `./scripts/validate-release.sh --full` cho dry-run các module có integration risk cao.

## Release candidate

- [ ] Working tree sạch sau validation.
- [ ] Commit/tag dùng khi quay video đã được ghi lại.
- [ ] Known limitations và phần cần credential/Devnet được nêu trong README tương ứng.
- [ ] Instructor quay từ đúng commit; mọi correction sau đó có changelog hoặc release mới.
