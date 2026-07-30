import { mkdirSync, writeFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";

// Public deterministic fixtures used only to deploy programs into the local test validator.
// They are not wallets, hold no funds, and must never be reused outside this lab.
const fixtures = [
  ["mock_verifier", 12],
  ["privacy_app", 13],
];

mkdirSync("target/deploy", { recursive: true });
for (const [name, byte] of fixtures) {
  const keypair = Keypair.fromSeed(Uint8Array.from({ length: 32 }, () => byte));
  writeFileSync(
    `target/deploy/${name}-keypair.json`,
    `${JSON.stringify(Array.from(keypair.secretKey))}\n`,
    { mode: 0o600 },
  );
  process.stdout.write(`${name}: ${keypair.publicKey.toBase58()}\n`);
}

const authority = Keypair.fromSeed(Uint8Array.from({ length: 32 }, () => 14));
writeFileSync(
  "target/test-authority.json",
  `${JSON.stringify(Array.from(authority.secretKey))}\n`,
  { mode: 0o600 },
);
process.stdout.write(`test_authority: ${authority.publicKey.toBase58()}\n`);
