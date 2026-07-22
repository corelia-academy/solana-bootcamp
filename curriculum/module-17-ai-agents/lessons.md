# Nội dung bài học — Module 17

## 17.1 Agent loop

Trigger → perception → proposal → deterministic validation → execution → confirmation → observation/log. Model proposal không phải transaction authority.

## 17.2 Agent wallet

Dedicated hot wallet/delegation, balance nhỏ, session allowance và revocation. Không dùng main wallet.

## 17.3 System prompt

Mô tả goals, allowed tools, constraints và escalation; security không chỉ dựa prompt.

## 17.4 Tool calling

Model chọn từ tools có schema; policy engine validate args/recipient/program/amount independent of model.

## 17.5 Memory

Short-term context có thể stale; long-term DB/PDA cần provenance, version và bounded retention.

## 17.6 Perception

Đọc balance/positions/prices qua MCP, kèm slot/timestamp/confidence và xử lý partial failure.

## 17.7 Swap

Quote → policy/slippage → simulate → approval → send → confirm → reconcile balance.

## 17.8 Vote

Agent đọc Poll state, giải thích rationale, chỉ vote trong allowlist và không double vote.

## 17.9 x402

Agent mua data trong spending cap, verify challenge và log economic purpose/payment proof.

## 17.10 Multi-agent

Coordinator delegate task với scope/timeout; sub-agent không tự động kế thừa signer authority.

## 17.11 Guardrails

Per-action/daily cap, allowlists, approval threshold, kill switch và revoke delegation.

## 17.12 Audit log

Lưu proposal hash, policy decision, signature/status và outcome; tránh đưa sensitive prompt vào chain.

## 17.13 Threats

Prompt injection, malicious tool output, hallucinated address, duplicate retry, wallet draining và stale memory.

## 17.14 Production resilience

Fresh blockhash, fee limit, retry classification, idempotency key, slippage và RPC failover.

## 17.15 Simulation

Chạy scenario end-to-end Devnet và red-team cases; chứng minh kill switch/approval hoạt động.

## Typed agent loop

`observe → propose → validate → approve → execute → confirm → record`. Model chỉ tạo Proposal typed; deterministic policy mới quyết định proposal có thể thực thi. Tool result không được tự động trở thành system instruction.

## Proposal contract

Proposal chứa action type, target, asset/amount, slippage, rationale và idempotency key. PolicyResult trả allow/deny/needs_approval cùng reason. ExecutionResult lưu signature/status/error và observation mới.

## Mock/local mode

Script dùng deterministic mock decision provider, mock MCP/x402 adapters và in-memory audit store nên chạy không cần model API key hay Devnet. Provider thật chỉ thay decision adapter, không thay policy/execution contract.

## Red-team tests

Prompt injection, malicious tool output, hallucinated mint/program, stale state, repeated execution sau timeout, drain amount, excessive slippage, rejected approval, active kill switch và inconsistent memory.

## Hoàn thành module khi

Agent không giữ seed phrase trong prompt/log, mọi write đi qua policy, retry dùng idempotency key, action log phân biệt proposed/executed/confirmed và end-to-end simulation xanh trong mock mode.
