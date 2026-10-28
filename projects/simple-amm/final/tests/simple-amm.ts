import * as anchor from "@anchor-lang/core";
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
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
  let lockedLp: PublicKey;
  const FEE_BPS = 30;
  const MINIMUM_LIQUIDITY = 1_000n;
  const feeSeed = (fee: number) => {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(fee);
    return buf;
  };

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
    [mintA, mintB] = Buffer.compare(first.toBuffer(), second.toBuffer()) < 0 ? [first, second] : [second, first];
    [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer(), feeSeed(FEE_BPS)],
      program.programId,
    );
    [lpMint] = PublicKey.findProgramAddressSync([Buffer.from("lp"), pool.toBuffer()], program.programId);
    [lockedLp] = PublicKey.findProgramAddressSync([Buffer.from("locked_lp"), pool.toBuffer()], program.programId);
    vaultA = getAssociatedTokenAddressSync(mintA, pool, true);
    vaultB = getAssociatedTokenAddressSync(mintB, pool, true);
    providerA = await createAssociatedTokenAccount(provider.connection, payer, mintA, payer.publicKey);
    providerB = await createAssociatedTokenAccount(provider.connection, payer, mintB, payer.publicKey);
    providerLp = getAssociatedTokenAddressSync(lpMint, payer.publicKey);
    await mintTo(provider.connection, payer, mintA, providerA, payer, 10_000_000n);
    await mintTo(provider.connection, payer, mintB, providerB, payer, 20_000_000n);
  });

  it("từ chối fee ngoài các fee tier cho phép", async () => {
    const badFee = 9_999;
    const [badPool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer(), feeSeed(badFee)],
      program.programId,
    );
    const [badLp] = PublicKey.findProgramAddressSync([Buffer.from("lp"), badPool.toBuffer()], program.programId);
    const [badLocked] = PublicKey.findProgramAddressSync(
      [Buffer.from("locked_lp"), badPool.toBuffer()],
      program.programId,
    );
    await expectFailure(
      program.methods
        .initializePool(badFee)
        .accounts({
          payer: payer.publicKey,
          mintA,
          mintB,
          pool: badPool,
          lpMint: badLp,
          vaultA: getAssociatedTokenAddressSync(mintA, badPool, true),
          vaultB: getAssociatedTokenAddressSync(mintB, badPool, true),
          lockedLp: badLocked,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
      /InvalidFee|fee tier/i,
    );
  });

  it("khởi tạo canonical pool, vaults và LP mint", async () => {
    await program.methods
      .initializePool(FEE_BPS)
      .accounts({
        payer: payer.publicKey,
        mintA,
        mintB,
        pool,
        lpMint,
        vaultA,
        vaultB,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const state = await program.account.pool.fetch(pool);
    expect(state.mintA.equals(mintA)).to.equal(true);
    expect(state.feeBps).to.equal(FEE_BPS);
  });

  it("thêm thanh khoản ban đầu, khóa MINIMUM_LIQUIDITY shares", async () => {
    await createAssociatedTokenAccount(provider.connection, payer, lpMint, payer.publicKey);
    await program.methods
      .addLiquidity(new BN(1_000_000), new BN(4_000_000), new BN(1_999_000))
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    expect((await getAccount(provider.connection, vaultA)).amount).to.equal(1_000_000n);
    expect((await getAccount(provider.connection, vaultB)).amount).to.equal(4_000_000n);
    // sqrt(1e6 * 4e6) = 2e6 shares, trong đó 1_000 bị khóa vĩnh viễn.
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(2_000_000n - MINIMUM_LIQUIDITY);
    expect((await getAccount(provider.connection, lockedLp)).amount).to.equal(MINIMUM_LIQUIDITY);
  });

  it("lần nạp sau chỉ lấy phần đúng tỷ lệ, không lấy phần dư", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
    // Tỷ lệ pool là 1 A : 4 B. User đưa trần 100_000 A và 1_000_000 B (dư B).
    await program.methods
      .addLiquidity(new BN(100_000), new BN(1_000_000), new BN(1))
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        lockedLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    expect(beforeA - (await getAccount(provider.connection, providerA)).amount).to.equal(100_000n);
    expect(beforeB - (await getAccount(provider.connection, providerB)).amount).to.equal(400_000n);
  });

  it("swap giữ constant-product direction và trả output", async () => {
    const beforeA = (await getAccount(provider.connection, providerA)).amount;
    const beforeB = (await getAccount(provider.connection, providerB)).amount;
    await program.methods
      .swap(new BN(100_000), new BN(300_000), true)
      .accounts({
        trader: payer.publicKey,
        pool,
        mintA,
        mintB,
        vaultA,
        vaultB,
        userA: providerA,
        userB: providerB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
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
        .accounts({
          trader: payer.publicKey,
          pool,
          mintA,
          mintB,
          vaultA,
          vaultB,
          userA: providerA,
          userB: providerB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
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
        .accounts({
          trader: payer.publicKey,
          pool,
          mintA,
          mintB,
          vaultA: providerA,
          vaultB,
          userA: providerA,
          userB: providerB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
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
      .accounts({
        provider: payer.publicKey,
        pool,
        mintA,
        mintB,
        lpMint,
        vaultA,
        vaultB,
        providerA,
        providerB,
        providerLp,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    expect((await getAccount(provider.connection, providerLp)).amount).to.equal(lpBefore - 1_000_000n);
    expect((await getAccount(provider.connection, providerA)).amount > aBefore).to.equal(true);
    expect((await getAccount(provider.connection, providerB)).amount > bBefore).to.equal(true);
  });
});
