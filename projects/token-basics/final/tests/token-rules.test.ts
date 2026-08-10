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
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { beforeAll, describe, expect, it } from "vitest";
import { toBaseUnits } from "../src/amounts.js";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";
const DECIMALS = 6;
const connection = new Connection(RPC_URL, "confirmed");
const payer = Keypair.generate();
const alice = Keypair.generate();
const bob = Keypair.generate();

let mint: PublicKey;
let otherMint: PublicKey;
let aliceAta: PublicKey;
let bobAta: PublicKey;

describe("token rules trên validator local", { timeout: 30_000 }, () => {
  beforeAll(async () => {
    const airdrop = await connection.requestAirdrop(payer.publicKey, 2_000_000_000);
    await connection.confirmTransaction(airdrop, "confirmed");

    mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
    otherMint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
    aliceAta = (await getOrCreateAssociatedTokenAccount(connection, payer, mint, alice.publicKey)).address;
    bobAta = (await getOrCreateAssociatedTokenAccount(connection, payer, mint, bob.publicKey)).address;
    await mintToChecked(connection, payer, mint, aliceAta, payer, toBaseUnits("100", DECIMALS), DECIMALS);
  }, 60_000);

  it("chặn mint khi người ký không phải mint authority", async () => {
    await expect(
      mintToChecked(connection, payer, mint, aliceAta, alice, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x4\./);
  });

  it("chặn burn khi người ký không phải owner của token account", async () => {
    await expect(
      burnChecked(connection, payer, aliceAta, mint, bob, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x4\./);
  });

  it("chặn transfer khi truyền sai mint", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, otherMint, bobAta, alice, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x3\./);
  });

  it("chặn transfer khi truyền sai decimals", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, mint, bobAta, alice, toBaseUnits("1", DECIMALS), 9),
    ).rejects.toThrow(/custom program error: 0x12\./);
  });

  it("chặn transfer vượt số dư", async () => {
    await expect(
      transferChecked(connection, payer, aliceAta, mint, bobAta, alice, toBaseUnits("101", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x1\./);
  });

  it("chặn mint sau khi thu hồi mint authority, state không đổi", async () => {
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
    await expect(
      mintToChecked(connection, payer, mint, aliceAta, payer, toBaseUnits("1", DECIMALS), DECIMALS),
    ).rejects.toThrow(/custom program error: 0x5\./);

    const [mintState, aliceState] = await Promise.all([getMint(connection, mint), getAccount(connection, aliceAta)]);
    expect(mintState.mintAuthority).toBeNull();
    expect(mintState.supply).toBe(toBaseUnits("100", DECIMALS));
    expect(aliceState.amount).toBe(toBaseUnits("100", DECIMALS));
  });
});
