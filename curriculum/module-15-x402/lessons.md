# Nội dung bài học — Module 15

## 15.1 HTTP 402

402 Payment Required từng thiếu settlement primitives phù hợp. Blockchain/token cho phép machine client thanh toán theo request nhưng server vẫn cần protocol semantics chính xác.

## 15.2 Request cycle

Client GET → server 402 requirements → client thanh toán → retry với proof → server verify → 200.

## 15.3 Payload

Network, asset, raw amount, recipient, resource, nonce/memo và expiry phải được bind với cùng challenge.

## 15.4 USDC settlement

Kiểm tra mint, source/destination ATA, decimals và confirmed transfer; không tin label “USDC”.

## 15.5 Paywall server

Endpoint sinh challenge, lưu nonce, trả machine-readable requirements và không leak gated content.

## 15.6 Paying client

Parse challenge, validate policy/spending cap, tạo exact payment, xin ký, confirm và retry idempotently.

## 15.7 Onchain verification

Fetch confirmed transaction và inspect successful token transfer đúng asset/recipient/amount/reference.

## 15.8 Replay prevention

Nonce unique, expiry, consumed marker và atomic claim. Concurrent requests không được unlock nhiều economic actions ngoài ý muốn.

## 15.9 dApp flow

Wallet hiển thị human-readable resource/amount trước ký; handle reject/timeout/confirmed.

## 15.10 Agent payer

Agent chỉ trả trong allowlist, per-request/session cap và deterministic policy; LLM không tự chọn recipient/mint từ text không tin cậy.

## 15.11 Failure/security

RPC timeout, late confirmation, refund policy, double submit, rate limiting và log privacy.

## 15.12 Tests

402 schema, valid unlock, wrong fields, expired/replay, failed/unconfirmed transaction và concurrency.

## Wire contract

PaymentRequirements chứa version, network, asset, amount base units, recipient, nonce, expiry và resource ID. PaymentProof chứa transaction signature và challenge binding. Server trả structured error cho invalid, expired, replayed, unconfirmed và retryable RPC failure.

## Request lifecycle

Client gọi resource → nhận 402 challenge → tạo/chuyển payment → retry với proof → verifier fetch confirmed transaction và kiểm tra exact settlement → replay store consume nonce nguyên tử → server trả resource.

## Concurrency và failure policy

Hai retry đồng thời cho cùng proof chỉ tạo một economic result. RPC timeout không consume nonce. Transaction failed/unconfirmed không được chấp nhận. Không tin signature string nếu chưa inspect instructions/balances, network, mint và recipient.

## Test matrix

Complete challenge, exact payment, wrong network/asset/amount/recipient, expiry, replay, failed transaction, timeout rồi retry và concurrent requests.

## Hoàn thành module khi

Mock mode chạy không cần Devnet; verifier interface có Solana adapter; schema dùng base units; tests chứng minh replay safety và agent client nhận structured result.
