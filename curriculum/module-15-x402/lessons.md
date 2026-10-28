# Nội dung bài học — Module 15

Module bám theo x402 **v2** (scheme `exact` trên Solana). Code học nằm ở [x402 Paywall](../../projects/x402-paywall/README.md): `src/x402.ts` tự hiện thực phía resource server để thấy từng bước, `src/server.ts` và `src/client.ts` dùng SDK chính thức (`@x402/express`, `@x402/fetch`, `@x402/svm`).

## 15.1 HTTP 402

Mã 402 Payment Required có từ lâu nhưng thiếu cách thanh toán phù hợp cho máy. x402 định nghĩa cách server công bố giá và cách client trả tiền ngay trong HTTP, để cả người dùng lẫn agent trả theo từng request.

## 15.2 Request cycle

Client gọi resource → server trả 402 + `PAYMENT-REQUIRED` → client chọn một option trong `accepts`, ký transaction → gọi lại kèm `PAYMENT-SIGNATURE` → server nhờ facilitator `/verify` rồi `/settle` → trả 200 + `PAYMENT-RESPONSE`.

## 15.3 Payload

`PaymentRequirements` gồm `scheme`, `network` (CAIP-2), `asset` (mint), `amount` (atomic units), `payTo`, `maxTimeoutSeconds` và `extra.feePayer`. `PaymentPayload` gồm `accepted` (option client chọn) và `payload.transaction` (transaction đã ký một phần, base64). Server **luôn** so khớp `accepted` với option mình đã công bố: nếu chỉ đưa payload cho facilitator, client có thể tự hạ `amount` hoặc đổi `payTo`.

## 15.4 USDC settlement

Transaction phải là `transferChecked` đúng mint, đúng decimals, vào ATA của `payTo`. ATA người nhận phải có sẵn: facilitator trả phí giao dịch nhưng không tạo ATA hay trả rent cho người nhận. Không tin chữ "USDC": kiểm tra mint address (Devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`).

## 15.5 Resource server

Dùng `paymentMiddleware` của `@x402/express` với `x402ResourceServer` + `HTTPFacilitatorClient` + `ExactSvmScheme`. Route config khai báo `accepts: [{ scheme: "exact", price: "$0.01", network, payTo }]`. Không trả nội dung khi settle chưa thành công.

## 15.6 Facilitator

Facilitator verify chữ ký, layout instruction, amount, mint, ATA người nhận, transfer authority và quy tắc fee payer, rồi submit transaction. Server có thể self-facilitate; khi đó phải tự giữ cache payload khoảng 120 giây để chặn settle trùng.

## 15.7 Paying client

Dùng `wrapFetchWithPayment` của `@x402/fetch` với `registerExactSvmScheme` và signer từ `@solana/kit`. Client chỉ ký, không tự gửi transaction. Dùng ví riêng có số dư nhỏ.

## 15.8 Replay và đồng thời

Một transaction đã ký chỉ có một signature nên không lên chain hai lần, nhưng server vẫn phải tránh trả nội dung nhiều lần cho cùng payload. Claim payload trong cache **trước** khi gọi facilitator; nhả claim khi verify fail hoặc facilitator lỗi mạng, giữ claim khi settle trả kết quả.

## 15.9 dApp flow

Wallet hiển thị resource, amount và người nhận dễ đọc trước khi ký; xử lý từ chối ký, timeout và đã confirm.

## 15.10 Agent payer

Agent chỉ trả trong allowlist, cap theo request/session và policy xác định trước. Model không tự chọn recipient hay mint từ text không tin cậy. `@x402/core/client` hỗ trợ payment policy để chặn option ngoài giới hạn.

## 15.11 Failure/security

Facilitator timeout (trả 502 retryable), settle fail, ATA người nhận chưa có, rate limit và log không lộ payload. Cân nhắc scheme `upto` khi giá phụ thuộc lượng dùng thực tế.

## 15.12 Tests

402 schema, payment hợp lệ, `accepted` sai amount/payTo/asset/network, payload hỏng, verify fail, replay, request đồng thời, facilitator timeout rồi retry.

## Wire contract

```text
PAYMENT-REQUIRED  = base64(JSON PaymentRequired { x402Version: 2, resource, accepts[] })
PAYMENT-SIGNATURE = base64(JSON PaymentPayload  { x402Version: 2, accepted, payload: { transaction } })
PAYMENT-RESPONSE  = base64(JSON SettleResponse  { success, transaction, network, payer })
```

## Hoàn thành module khi

`pnpm test` xanh ở bản final (chạy offline với facilitator mock); giải thích được vì sao server phải so khớp `accepted` và claim payload trước khi verify; chạy được `start:server` + `start:client` trên Devnet với ví riêng có USDC Devnet.
