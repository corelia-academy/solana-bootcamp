import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("simple-amm", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program: any = anchor.workspace.SimpleAmm;
  const payer = (provider.wallet as anchor.Wallet).payer;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let providerA: PublicKey;
  let providerB: PublicKey;
  let providerLp: PublicKey;
  let pool: PublicKey;
  let lpMint: PublicKey;
  let vaultA: PublicKey;
  let vaultB: PublicKey;

  const expectFailure = async (promise: Promise<unknown>, message: RegExp) => {
    try {
      await promise;
      expect.fail("Transaction đáng lẽ phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(message);
    }
  };

  before(async () => {
    const first = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const second = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    [mintA, mintB] = Buffer.compare(first.toBuffer(), second.toBuffer()) < 0
      ? [first, second]
      : [second, first];
    [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId,
    );
    [lpMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), pool.toBuffer()],
      program.programId,
    );
    vaultA = getAssociatedTokenAddressSync(mintA, pool, true);
    vaultB = getAssociatedTokenAddressSync(mintB, pool, true);
    providerA = await createAssociatedTokenAccount(provider.connection, payer, mintA, payer.publicKey);
    providerB = await createAssociatedTokenAccount(provider.connection, payer, mintB, payer.publicKey);
    providerLp = getAssociatedTokenAddressSync(lpMint, payer.publicKey);
    await mintTo(provider.connection, payer, mintA, providerA, payer, 10_000_000n);
    await mintTo(provider.connection, payer, mintB, providerB, payer, 20_000_000n);
  });

  it("khởi tạo canonical pool, vaults và LP mint", async () => {
    await program.methods
      .initializePool(30)
      .accounts({
        payer: payer.publicKey,
        mintA,
        mintB,
        pool,
        lpMint,
        vaultA,
        vaultB,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    const state = await program.account.pool.fetch(pool);
    expect(state.mintA.equals(mintA)).to.equal(true);
    expect(state.feeBps).to.equal(30);
  });

  it("thêm thanh khoản ban đầu và mint LP shares", async () => {
    await createAssociatedTokenAccount(provider.connection, payer, lpMint, payer.publicKey);
    await program.methods
      .addLiquidity(new BN(1_000_000), new BN(4_000_000), new BN(2_000_000))
      .accounts({ provider: payer.publicKey, pool, mintA, mintB, lpMint, vaultA, vaultB, providerA, providerB, providerLp, tokenProgram: TOKEN_PROGRAM_ID })
      .rpc();
    expect((await getAccount(provider.connection, vaultA)).amount).to.equal(1_000_000n);
    expect((await getAccount(provider.connection, vaultB)).amount).to.equal(4_000_000n);
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(2_000_000n);
  });

  it("swap giữ constant-product direction và trả output", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
    await program.methods
      .swap(new BN(100_000), new BN(300_000), true)
      .accounts({ trader: payer.publicKey, pool, mintA, mintB, vaultA, vaultB, userA: providerA, userB: providerB, tokenProgram: TOKEN_PROGRAM_ID })
      .rpc();
    expect((await getAccount(provider.connection, providerA)).amount).to.equal(beforeA - 100_000n);
    expect((await getAccount(provider.connection, providerB)).amount > beforeB + 300_000n).to.equal(true);
  });

  it("slippage failure rollback toàn bộ balance", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
    await expectFailure(
      program.methods
        .swap(new BN(100_000), new BN(4_000_000), true)
        .accounts({ trader: payer.publicKey, pool, mintA, mintB, vaultA, vaultB, userA: providerA, userB: providerB, tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
      /SlippageExceeded|Minimum output|6003/i,
    );
    expect((await getAccount(provider.connection, providerA)).amount).to.equal(beforeA);
    expect((await getAccount(provider.connection, providerB)).amount).to.equal(beforeB);
  });

  it("từ chối vault không thuộc pool", async () => {
    await expectFailure(
      program.methods
        .swap(new BN(1), new BN(1), true)
        .accounts({ trader: payer.publicKey, pool, mintA, mintB, vaultA: providerA, vaultB, userA: providerA, userB: providerB, tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
      /vault_a|ConstraintAssociated|ConstraintTokenOwner|associated/i,
    );
  });

  it("burn LP và rút thanh khoản theo tỷ lệ", async () => {
    const lpBefore = (await getAccount(provider.connection, providerLp)).amount;
    const aBefore = (await getAccount(provider.connection, providerA)).amount;
    const bBefore = (await getAccount(provider.connection, providerB)).amount;
    await program.methods
      .removeLiquidity(new BN(1_000_000), new BN(1), new BN(1))
      .accounts({ provider: payer.publicKey, pool, mintA, mintB, lpMint, vaultA, vaultB, providerA, providerB, providerLp, tokenProgram: TOKEN_PROGRAM_ID })
      .rpc();
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(lpBefore - 1_000_000n);
    expect((await getAccount(provider.connection, providerA)).amount > aBefore).to.equal(true);
    expect((await getAccount(provider.connection, providerB)).amount > bBefore).to.equal(true);
  });
});
