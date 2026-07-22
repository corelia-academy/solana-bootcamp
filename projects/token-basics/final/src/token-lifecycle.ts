import {
  AuthorityType,
  burnChecked,
  createMint,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
  setAuthority,
  transferChecked,
} from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";
import { assertSupplyInvariant, toBaseUnits } from "./amounts.js";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";
const DECIMALS = 6;

async function main(): Promise<void> {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();

  const airdrop = await connection.requestAirdrop(payer.publicKey, 2_000_000_000);
  await connection.confirmTransaction(airdrop, "confirmed");

  const mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  const aliceAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, alice.publicKey);
  const bobAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, bob.publicKey);

  await mintToChecked(connection, payer, mint, aliceAta.address, payer, toBaseUnits("100", DECIMALS), DECIMALS);
  await transferChecked(connection, payer, aliceAta.address, mint, bobAta.address, alice, toBaseUnits("25", DECIMALS), DECIMALS);
  await burnChecked(connection, payer, bobAta.address, mint, bob, toBaseUnits("5", DECIMALS), DECIMALS);

  const [mintState, aliceState, bobState] = await Promise.all([
    getMint(connection, mint),
    getAccount(connection, aliceAta.address),
    getAccount(connection, bobAta.address),
  ]);
  assertSupplyInvariant(mintState.supply, [aliceState.amount, bobState.amount]);

  await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
  console.table({ mint: mint.toBase58(), alice: aliceState.amount.toString(), bob: bobState.amount.toString(), supply: mintState.supply.toString() });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
