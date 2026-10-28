import * as anchor from "@anchor-lang/core";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  // IDL được sinh khi `anchor build`; dùng dynamic workspace để test vẫn type-check trước build.
  const program: any = anchor.workspace.Escrow;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const maker = Keypair.generate();
  const taker = Keypair.generate();

  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let makerAtaB: PublicKey;
  let takerAtaA: PublicKey;
  let takerAtaB: PublicKey;

  const deriveOffer = (seed: anchor.BN) => {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
      program.programId,
    );
    const vault = getAssociatedTokenAddressSync(mintA, escrow, true);
    return { escrow, vault };
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
    for (const wallet of [maker, taker]) {
      const signature = await provider.connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature, "confirmed");
    }
    mintA = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    mintB = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    makerAtaA = await createAssociatedTokenAccount(provider.connection, payer, mintA, maker.publicKey);
    makerAtaB = await createAssociatedTokenAccount(provider.connection, payer, mintB, maker.publicKey);
    takerAtaA = await createAssociatedTokenAccount(provider.connection, payer, mintA, taker.publicKey);
    takerAtaB = await createAssociatedTokenAccount(provider.connection, payer, mintB, taker.publicKey);
    await mintTo(provider.connection, payer, mintA, makerAtaA, payer, 1_000_000_000n);
    await mintTo(provider.connection, payer, mintB, takerAtaB, payer, 1_000_000_000n);
  });

  it("make khóa đúng token A trong vault", async () => {
    const seed = new anchor.BN(1);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods
      .make(seed, new anchor.BN(100_000_000), new anchor.BN(250_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker])
      .rpc();

    expect((await getAccount(provider.connection, vault)).amount).to.equal(100_000_000n);
    const state = await program.account.escrow.fetch(escrow);
    expect(state.maker.equals(maker.publicKey)).to.equal(true);
  });

  it("take settlement nguyên tử và đóng vault/state", async () => {
    const seed = new anchor.BN(2);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(100_000_000), new anchor.BN(250_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();

    // Mô phỏng token ngoài ý muốn gửi thẳng vào vault; không được làm kẹt lệnh close.
    await transfer(provider.connection, maker, makerAtaA, vault, maker, 1n);
    await program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc();

    expect((await getAccount(provider.connection, takerAtaA)).amount).to.equal(100_000_001n);
    expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);
    expect(await provider.connection.getAccountInfo(vault)).to.equal(null);
  });

  it("maker có thể refund và đóng offer", async () => {
    const seed = new anchor.BN(3);
    const { escrow, vault } = deriveOffer(seed);
    const before = (await getAccount(provider.connection, makerAtaA)).amount;
    await program.methods.make(seed, new anchor.BN(10_000_000), new anchor.BN(20_000_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    await program.methods.refund().accounts({ maker: maker.publicKey, escrow, mintA, vault, makerAtaA, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    expect((await getAccount(provider.connection, makerAtaA)).amount).to.equal(before);
    expect(await provider.connection.getAccountInfo(escrow)).to.equal(null);
  });

  it("từ chối amount bằng 0 và hai mint giống nhau", async () => {
    const zero = deriveOffer(new anchor.BN(10));
    await expectFailure(program.methods.make(new anchor.BN(10), new anchor.BN(0), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, ...zero, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc(), /Số lượng|InvalidAmount|6000/);

    const sameMint = deriveOffer(new anchor.BN(11));
    await expectFailure(program.methods.make(new anchor.BN(11), new anchor.BN(1), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB: mintA, makerAtaA, ...sameMint, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc(), /Mint A|SameMint|6001/);
  });

  it("từ chối người khác refund offer của maker", async () => {
    const seed = new anchor.BN(12);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(1), new anchor.BN(1))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    await expectFailure(program.methods.refund().accounts({
      maker: taker.publicKey, escrow, mintA, vault, makerAtaA, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintSeeds|seeds constraint/i);
  });

  it("take lần hai thất bại vì offer đã đóng", async () => {
    const { escrow, vault } = deriveOffer(new anchor.BN(2));
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /AccountNotInitialized|not initialized|3012/i);
  });

  it("từ chối take với mint B khác mint đã ghi trong offer", async () => {
    const seed = new anchor.BN(13);
    const { escrow, vault } = deriveOffer(seed);
    await program.methods.make(seed, new anchor.BN(1_000), new anchor.BN(1_000))
      .accounts({ maker: maker.publicKey, mintA, mintB, makerAtaA, escrow, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([maker]).rpc();
    const mintC = await createMint(provider.connection, payer, payer.publicKey, null, 6);
    const takerAtaC = await createAssociatedTokenAccount(provider.connection, payer, mintC, taker.publicKey);
    const makerAtaC = await createAssociatedTokenAccount(provider.connection, payer, mintC, maker.publicKey);
    await mintTo(provider.connection, payer, mintC, takerAtaC, payer, 1_000_000n);
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB: mintC, vault,
      takerAtaA, takerAtaB: takerAtaC, makerAtaB: makerAtaC, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintHasOne|has one|2001/i);
    // Offer vẫn còn nguyên sau khi tấn công thất bại.
    expect((await getAccount(provider.connection, vault)).amount).to.equal(1_000n);
  });

  it("từ chối maker_ata_b không thuộc maker (substituted receive account)", async () => {
    const { escrow, vault } = deriveOffer(new anchor.BN(13));
    await expectFailure(program.methods.take().accounts({
      taker: taker.publicKey, maker: maker.publicKey, escrow, mintA, mintB, vault,
      takerAtaA, takerAtaB, makerAtaB: takerAtaB, tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([taker]).rpc(), /ConstraintTokenOwner|token owner|2015/i);
  });
});
