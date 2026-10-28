/**
 * Paying client thật, dùng SDK x402 v2 chính thức.
 *
 * Chạy:
 *   PAYER_KEYPAIR=~/.config/solana/devnet-payer.json pnpm start:client
 *
 * Ví payer cần USDC Devnet (faucet: https://faucet.circle.com). KHÔNG dùng ví chính:
 * tạo ví riêng, nạp số dư nhỏ. `wrapFetchWithPayment` tự xử lý 402 → ký → gọi lại.
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientSvmSigner } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { SOLANA_DEVNET } from "./x402.js";

const keypairPath = (process.env.PAYER_KEYPAIR ?? "").replace(/^~/, homedir());
if (!keypairPath) throw new Error("Thiếu PAYER_KEYPAIR (đường dẫn keypair JSON của ví Devnet riêng)");
const url = process.env.RESOURCE_URL ?? "http://localhost:4021/data";

const secret = Uint8Array.from(JSON.parse(await readFile(keypairPath, "utf8")) as number[]);
const signer = toClientSvmSigner(await createKeyPairSignerFromBytes(secret));

const client = registerExactSvmScheme(new x402Client(), { signer, networks: [SOLANA_DEVNET] });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment(url);
console.log("status", response.status);
console.log("PAYMENT-RESPONSE", response.headers.get("PAYMENT-RESPONSE"));
console.log(await response.json());
