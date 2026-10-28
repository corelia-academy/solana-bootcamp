# Nội dung bài học — Module 16

## 16.1 MCP primitives

Host chứa model/client; server cung cấp tools, resources, prompts. Protocol structure không tự tạo security boundary.

## 16.2 Transport

stdio phù hợp local child process; HTTP/SSE phù hợp remote nhưng cần auth, lifecycle, timeout và observability.

## 16.3 Tool schema

Tên/description rõ, JSON Schema giới hạn input, structured output ổn định và error có khả năng phục hồi.

## 16.4 Balance tool

Validate public key/network, bounded timeout, trả lamports và SOL display riêng.

## 16.5 Holdings tool

Query token accounts đúng program, normalize mint/amount/decimals, paginate/bound result.

## 16.6 `send_sol`

Write tool cần dedicated signer, recipient allowlist, max amount, simulation, approval và confirmation.

## 16.7 `call_program`

Không nên là arbitrary raw transaction. Allowlist program/instruction, typed args/accounts và policy theo action.

## 16.8 Resources

Expose selected account/PDA state read-only với URI ổn định và freshness metadata.

## 16.9 Prompts

Prompt template giúp workflow nhất quán nhưng không được bypass tool validation.

## 16.10 Authentication

Tách read/write permissions, identify caller và không gửi signer secrets qua protocol messages.

Quyền ghi luôn do server quyết định: config của host, session đã xác thực hoặc approval của người dùng. Không bao giờ đưa field kiểu `authorized: boolean` vào `inputSchema`, vì model điền mọi field trong schema và có thể tự gửi `true`. Trong project, `SolanaTools` nhận `AuthPort` lúc khởi tạo; bản `final` bật quyền ghi bằng `SOLANA_MCP_WRITE_ENABLED=true`. Test bắt buộc: gửi kèm `authorized: true` khi server tắt quyền ghi vẫn phải trả `UNAUTHORIZED` và không gọi RPC.

## 16.11 Rate/cost control

Per-tool rate, concurrency, RPC budget, token budget và circuit breaker.

## 16.12 Remote deploy

TLS, auth, health checks, structured logs, secret management và graceful shutdown.

## 16.13 Tests

Schema, mock RPC, error mapping, policy denial, successful read/write và transport lifecycle.

## Public interface

Read tools: `get_account_balance`, `get_token_holdings`. Write tools: `send_sol`, `call_program`. Mọi input có JSON Schema; output là structured content/error, không yêu cầu model parse log tự do.

## Policy pipeline

Validate schema → authenticate caller → evaluate allowlist/spending cap → simulate write → yêu cầu approval nếu vượt ngưỡng → execute → confirm → audit log. Read tools cũng có timeout và bounded result.

## Mock/local mode

RPC, signer và clock được inject qua interfaces. Mock client chạy toàn test không cần wallet/API key. Devnet adapter là bước cấu hình riêng và không được dùng secret trong source hoặc tool response.

## Test matrix

Invalid schema/public key, RPC timeout, bounded holdings, unauthorized write, cap exhaustion, wrong recipient/program, failed simulation, confirmation timeout và successful mock/Devnet action.

## Hoàn thành module khi

Server stdio chạy được, mock-client tests xanh, write tool không thể bypass policy, errors có code/retryable flag và README mô tả trust boundary của host/client/server.
