/**
 * Resource server thật, dùng SDK x402 v2 chính thức trên Solana Devnet.
 *
 * Chạy:
 *   PAY_TO=<ví Devnet nhận USDC> pnpm start:server
 *
 * Middleware làm đúng các bước như `gate()` trong src/x402.ts: trả 402 + PAYMENT-REQUIRED,
 * đọc PAYMENT-SIGNATURE, gọi facilitator /verify và /settle, gắn PAYMENT-RESPONSE.
 * Ví PAY_TO phải có sẵn USDC ATA: facilitator trả phí giao dịch nhưng không tạo ATA người nhận.
 */
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET } from "./x402.js";

const payTo = process.env.PAY_TO;
if (!payTo) throw new Error("Thiếu PAY_TO (địa chỉ ví Devnet nhận thanh toán)");
const port = Number(process.env.PORT ?? 4021);
const facilitatorUrl = process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitator).register(SOLANA_DEVNET, new ExactSvmScheme());

const app = express();
app.use(
  paymentMiddleware(
    {
      "GET /data": {
        accepts: [{ scheme: "exact", price: "$0.01", network: SOLANA_DEVNET, payTo }],
        description: "Bootcamp premium data",
        mimeType: "application/json",
      },
    },
    resourceServer,
  ),
);

app.get("/data", (_req, res) => {
  res.json({ lesson: "x402", tip: "Payment chỉ được chấp nhận sau khi facilitator settle thành công." });
});

app.listen(port, () => console.log(`x402 server: http://localhost:${port}/data (facilitator ${facilitatorUrl})`));
