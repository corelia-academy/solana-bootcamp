import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("stablecoin-lite", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program: any = anchor.workspace.StablecoinLite;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const admin = payer;
  const minter = Keypair.generate();
  const outsider = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), mintKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [allowance] = PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), config.toBuffer(), minter.publicKey.toBuffer()],
    program.programId,
  );
  let destination: PublicKey;

  const expectFailure = async (promise: Promise<unknown>, message: RegExp) => {
    try {
      await promise;
      expect.fail("Transaction đáng lẽ phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(message);
    }
  };

  before(async () => {
    for (const wallet of [minter, outsider]) {
      const signature = await provider.connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(signature, "confirmed");
    }
  });

  it("tạo mint và config trong cùng instruction, Config PDA là mint authority", async () => {
    await program.methods
      .initializeConfig(6, new BN(1_000))
      .accounts({
        admin: admin.publicKey,
        mint: mintKeypair.publicKey,
        config,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([mintKeypair])
      .rpc();

    const mintState = await getMint(provider.connection, mintKeypair.publicKey);
    expect(mintState.mintAuthority?.toBase58()).to.equal(config.toBase58());
    expect(mintState.freezeAuthority).to.equal(null);
    expect(mintState.decimals).to.equal(6);

    destination = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      mintKeypair.publicKey,
      minter.publicKey,
    );
  });

  it("không nhận mint đã tồn tại (chặn front-run lúc initialize)", async () => {
    // Mint tạo sẵn ngoài program: kể cả khi authority đã là Config PDA tương ứng,
    // initialize_config vẫn phải fail vì instruction tự tạo account mint.
    const existing = Keypair.generate();
    const [existingConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), existing.publicKey.toBuffer()],
      program.programId,
    );
    await createMint(provider.connection, payer, existingConfig, null, 6, existing);
    await expectFailure(
      program.methods
        .initializeConfig(6, new BN(1_000))
        .accounts({
          admin: outsider.publicKey,
          mint: existing.publicKey,
          config: existingConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([outsider, existing])
        .rpc(),
      /already in use|custom program error: 0x0/i,
    );
  });

  it("cấp allowance cho minter", async () => {
    await program.methods
      .setMinter(new BN(700))
      .accounts({
        admin: admin.publicKey,
        config,
        minter: minter.publicKey,
        allowance,
      })
      .rpc();

    const state = await program.account.config.fetch(config);
    expect(state.totalCap.toNumber()).to.equal(1_000);
    expect(state.paused).to.equal(false);
    expect((await program.account.minterAllowance.fetch(allowance)).remaining.toNumber()).to.equal(700);
  });

  it("từ chối admin không hợp lệ", async () => {
    await expectFailure(
      program.methods
        .setPaused(true)
        .accounts({ admin: outsider.publicKey, config })
        .signers([outsider])
        .rpc(),
      /ConstraintHasOne|has one/i,
    );
  });

  it("mint trong allowance rồi chặn khi pause mà không đổi state", async () => {
    await program.methods
      .authorizedMint(new BN(400))
      .accounts({
        minter: minter.publicKey,
        config,
        allowance,
        mint: mintKeypair.publicKey,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([minter])
      .rpc();
    await program.methods.setPaused(true).accounts({ admin: admin.publicKey, config }).rpc();

    const balanceBefore = (await getAccount(provider.connection, destination)).amount;
    const allowanceBefore = (await program.account.minterAllowance.fetch(allowance)).remaining.toNumber();
    await expectFailure(
      program.methods
        .authorizedMint(new BN(1))
        .accounts({
          minter: minter.publicKey,
          config,
          allowance,
          mint: mintKeypair.publicKey,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([minter])
        .rpc(),
      /Paused|pause|6001/i,
    );
    expect((await getAccount(provider.connection, destination)).amount).to.equal(balanceBefore);
    expect((await program.account.minterAllowance.fetch(allowance)).remaining.toNumber()).to.equal(allowanceBefore);
    await program.methods.setPaused(false).accounts({ admin: admin.publicKey, config }).rpc();
  });

  it("đạt cap chính xác rồi từ chối vượt cap", async () => {
    await program.methods
      .setMinter(new BN(700))
      .accounts({ admin: admin.publicKey, config, minter: minter.publicKey, allowance })
      .rpc();
    await program.methods
      .authorizedMint(new BN(600))
      .accounts({ minter: minter.publicKey, config, allowance, mint: mintKeypair.publicKey, destination, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([minter])
      .rpc();
    await expectFailure(
      program.methods
        .authorizedMint(new BN(1))
        .accounts({ minter: minter.publicKey, config, allowance, mint: mintKeypair.publicKey, destination, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([minter])
        .rpc(),
      /CapExceeded|total cap|6003/i,
    );
    expect((await getMint(provider.connection, mintKeypair.publicKey)).supply).to.equal(1_000n);
  });

  it("từ chối mint account không khớp config", async () => {
    const wrongMint = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const wrongDestination = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      wrongMint,
      minter.publicKey,
    );
    await expectFailure(
      program.methods
        .authorizedMint(new BN(1))
        .accounts({ minter: minter.publicKey, config, allowance, mint: wrongMint, destination: wrongDestination, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([minter])
        .rpc(),
      /ConstraintSeeds|ConstraintHasOne|seeds constraint/i,
    );
  });

  it("holder burn làm giảm balance và mint supply", async () => {
    await program.methods
      .burn(new BN(100))
      .accounts({
        holder: minter.publicKey,
        config,
        mint: mintKeypair.publicKey,
        holderAccount: destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([minter])
      .rpc();
    expect((await getAccount(provider.connection, destination)).amount).to.equal(900n);
    expect((await getMint(provider.connection, mintKeypair.publicKey)).supply).to.equal(900n);
  });
});
