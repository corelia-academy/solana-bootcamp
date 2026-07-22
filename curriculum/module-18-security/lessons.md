# Nội dung bài học — Module 18

## 18.1 Common vulnerabilities

Missing signer/owner/PDA validation, arbitrary CPI, duplicate accounts, reinit, unchecked arithmetic và token relationship errors.

## 18.2 Account validation

Với từng account: expected address/owner/type/signer/writable/relationship. Validate gần boundary.

## 18.3 PDA validation

Seeds chứa domain separator và identity fields; verify bump/address, không nhận arbitrary program-controlled account.

## 18.4 Reinitialization

Ngăn initialize lại state cũ hoặc reset authority/critical fields; test pre-funded/partially initialized scenarios khi relevant.

## 18.5 Duplicate accounts

Attacker truyền cùng account cho hai roles có thể phá invariant. Require distinct keys khi semantics yêu cầu.

## 18.6 Authority management

Document admin/upgrade/mint/pause authorities, transfer/revoke flow và recovery assumptions.

## 18.7 Multisig

Squads/multisig giảm single-key risk nhưng thêm governance/ops complexity; xác định threshold và emergency process.

## 18.8 RPC strategy

Provider limits, commitment, failover, data consistency và health checks. Không blind retry across providers.

## 18.9 Compute/priority fees

Đo compute, tối ưu account/data/CPI, đặt compute budget và fee policy có cap.

## 18.10 Blockhash/retry

Track last valid block height; phân biệt expired, dropped, confirmed và unknown; retry idempotently.

## 18.11 User errors

Map custom errors thành message actionable, không leak secrets và giữ technical detail cho diagnostics.

## 18.12 Monitoring

Theo dõi error rate, confirmation latency, balances/authorities, program logs và kill-switch events.

## 18.13 Audit preparation

Freeze scope/commit, architecture, state/instruction tables, threat model, build/test commands, known issues và evidence checklist.

## Review workflow

Lập inventory program IDs, upgrade authorities, PDAs, signer paths, token authorities và external dependencies. Với mỗi invariant, liên kết tới constraint/code và test chứng minh; checklist không được chỉ đánh dấu bằng cảm tính.

## Các lớp kiểm tra

Account owner/discriminator, signer/authority, PDA seeds/bump, initialization/close/realloc, duplicate account aliasing, checked arithmetic, CPI target, token mint/owner, stale oracle/indexer data và replay/idempotency.

## Production package

Ghi toolchain/commit, build/deploy commands, program ID, cluster, upgrade plan, RPC/retry policy, monitoring signals, incident contacts và known limitations. Devnet launch phải tái lập được từ clean environment.

## Test và red-team

Chạy regression suite, Security CTF, privilege-negative tests, boundary/fuzz tests phù hợp và frontend/server retry tests. Mỗi vulnerability đã vá phải có test thất bại khi bỏ bản vá.

## Hoàn thành module khi

Security checklist có evidence links, authority plan không mơ hồ, deploy artifact tái lập được, monitoring/retry runbook rõ ràng và mọi limitation chưa xử lý được ghi công khai.
