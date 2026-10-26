import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import { expect } from "chai";

describe("treasury", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/treasury.ts).
  const program: any = anchor.workspace.treasury;
  const connection = provider.connection;
  const { Keypair, PublicKey, SystemProgram, Transaction } = anchor.web3;

  const admin = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const carol = Keypair.generate();
  const recipient = Keypair.generate().publicKey;

  function findTreasury(adminKey: anchor.web3.PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), adminKey.toBuffer()],
      program.programId,
    )[0];
  }

  function findVault(treasuryKey: anchor.web3.PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), treasuryKey.toBuffer()],
      program.programId,
    )[0];
  }

  const treasury = findTreasury(admin.publicKey);
  const vault = findVault(treasury);

  async function fund(to: anchor.web3.PublicKey, lamports: number) {
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: provider.wallet.publicKey, toPubkey: to, lamports }),
    );
    await provider.sendAndConfirm(tx);
  }

  const MAX_PRIORITY_FEE = 10_000; // micro-lamports mỗi compute unit

  async function priorityFee() {
    const fees = await connection.getRecentPrioritizationFees();
    const highest = Math.max(0, ...fees.map((fee) => fee.prioritizationFee));
    return Math.min(highest, MAX_PRIORITY_FEE);
  }

  async function sendWithRetry(tx: anchor.web3.Transaction, signers: anchor.web3.Keypair[]) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = provider.wallet.publicKey;
    tx.partialSign(...signers);
    const raw = (await provider.wallet.signTransaction(tx)).serialize();
    const signature = await connection.sendRawTransaction(raw, { maxRetries: 0 });
    while ((await connection.getBlockHeight("confirmed")) <= lastValidBlockHeight) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const status = (await connection.getSignatureStatuses([signature])).value[0];
      if (status?.err) throw new Error(`Giao dịch lỗi: ${JSON.stringify(status.err)}`);
      if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
        return signature;
      }
      await connection.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 0 });
    }
    throw new Error("Blockhash đã hết hạn: tạo và ký lại giao dịch mới");
  }

  const FRIENDLY_ERRORS: Record<string, string> = {
    NotApprover: "Ví này không có quyền duyệt rút tiền.",
    DuplicateApprover: "Cần chữ ký của hai approver khác nhau.",
    Paused: "Quỹ đang tạm dừng, hãy liên hệ admin.",
    InsufficientFunds: "Quỹ không đủ SOL cho khoản rút này.",
  };

  function friendlyError(error: unknown) {
    if (error instanceof anchor.AnchorError) {
      const code = error.error.errorCode.code;
      return FRIENDLY_ERRORS[code] ?? `Giao dịch bị từ chối (mã ${code}).`;
    }
    return "Không gửi được giao dịch, hãy thử lại sau.";
  }

  function withdraw(
    amount: number,
    one: anchor.web3.Keypair,
    two: anchor.web3.Keypair,
    overrides: Record<string, anchor.web3.PublicKey> = {},
  ) {
    return program.methods
      .withdraw(new BN(amount))
      .accounts({ treasury, vault, approverOne: one.publicKey, approverTwo: two.publicKey, recipient, ...overrides })
      .signers([one, two]);
  }

  before(async () => {
    const payer = provider.wallet.publicKey;
    if ((await connection.getBalance(payer)) < 1_000_000_000) {
      const signature = await connection.requestAirdrop(payer, 2_000_000_000);
      await connection.confirmTransaction(signature, "confirmed");
    }
  });

  it("khởi tạo treasury và vault", async () => {
    await fund(admin.publicKey, 50_000_000);
    const approvers = [alice.publicKey, bob.publicKey, carol.publicKey];
    await program.methods
      .initialize(approvers)
      .accounts({ treasury, vault, admin: admin.publicKey })
      .signers([admin])
      .rpc();

    const state = await program.account.treasury.fetch(treasury);
    expect(state.admin.equals(admin.publicKey)).to.equal(true);
    expect(state.approvers[1].equals(bob.publicKey)).to.equal(true);
    expect(state.paused).to.equal(false);
    const vaultState = await program.account.vault.fetch(vault);
    expect(vaultState.treasury.equals(treasury)).to.equal(true);
  });

  it("không cho khởi tạo lại treasury", async () => {
    const mallory = Keypair.generate();
    try {
      await program.methods
        .initialize([admin.publicKey, mallory.publicKey, mallory.publicKey])
        .accounts({ treasury, vault, admin: admin.publicKey })
        .signers([admin])
        .rpc();
      expect.fail("khởi tạo lần hai phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(/already in use|custom program error: 0x0/);
    }
    const state = await program.account.treasury.fetch(treasury);
    expect(state.approvers[0].equals(alice.publicKey)).to.equal(true);
  });

  it("hai approver rút được SOL", async () => {
    await fund(vault, 300_000_000);
    await withdraw(100_000_000, alice, bob).rpc();
    expect(await connection.getBalance(recipient)).to.equal(100_000_000);
  });

  it("chặn treasury giả mượn vault thật", async () => {
    const mallory = Keypair.generate();
    const mallory2 = Keypair.generate();
    const fakeTreasury = findTreasury(mallory.publicKey);
    await fund(mallory.publicKey, 50_000_000);
    await program.methods
      .initialize([mallory.publicKey, mallory2.publicKey, mallory2.publicKey])
      .accounts({ treasury: fakeTreasury, vault: findVault(fakeTreasury), admin: mallory.publicKey })
      .signers([mallory])
      .rpc();

    const before = await connection.getBalance(vault);
    try {
      await withdraw(50_000_000, mallory, mallory2, {
        treasury: fakeTreasury,
        recipient: mallory.publicKey,
      }).rpc();
      expect.fail("vault của treasury khác phải bị từ chối");
    } catch (error) {
      expect(String(error)).to.contain("ConstraintSeeds");
    }
    expect(await connection.getBalance(vault)).to.equal(before);
  });

  it("chặn một approver ký hai vai", async () => {
    const before = await connection.getBalance(vault);
    try {
      await withdraw(50_000_000, alice, alice, { recipient: alice.publicKey }).rpc();
      expect.fail("một ví không được ký thay hai approver");
    } catch (error) {
      expect(String(error)).to.contain("DuplicateApprover");
      expect(friendlyError(error)).to.equal("Cần chữ ký của hai approver khác nhau.");
    }
    expect(await connection.getBalance(vault)).to.equal(before);
  });

  it("chặn rút quá số dư, giữ lại tiền rent", async () => {
    const balance = await connection.getBalance(vault);
    try {
      await withdraw(balance, bob, carol).rpc();
      expect.fail("rút hết lamports phải thất bại");
    } catch (error) {
      expect(String(error)).to.contain("InsufficientFunds");
    }
    expect(await connection.getBalance(vault)).to.equal(balance);
  });

  it("chặn người lạ tạm dừng quỹ", async () => {
    try {
      await program.methods
        .setPaused(true)
        .accounts({ treasury, admin: admin.publicKey })
        .rpc();
      expect.fail("tạm dừng mà không có chữ ký admin phải thất bại");
    } catch (error) {
      expect(String(error)).to.match(/Missing signature|Signature verification failed/);
    }
    const state = await program.account.treasury.fetch(treasury);
    expect(state.paused).to.equal(false);
  });

  it("admin tạm dừng thì không rút được", async () => {
    const setPaused = (paused: boolean) =>
      program.methods.setPaused(paused).accounts({ treasury, admin: admin.publicKey }).signers([admin]).rpc();
    await setPaused(true);
    try {
      await withdraw(50_000_000, alice, bob).rpc();
      expect.fail("quỹ đang tạm dừng phải chặn withdraw");
    } catch (error) {
      expect(String(error)).to.contain("Paused");
    }

    await setPaused(false);
    const state = await program.account.treasury.fetch(treasury);
    expect(state.paused).to.equal(false);
  });

  it("gửi withdraw có compute budget và theo dõi blockhash", async () => {
    const withdrawIx = await withdraw(10_000_000, alice, carol).instruction();
    const tx = new Transaction().add(
      anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 30_000 }),
      anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: await priorityFee() }),
      withdrawIx,
    );
    const signature = await sendWithRetry(tx, [alice, carol]);

    const result = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    expect(result?.meta?.err).to.equal(null);
    expect(result?.meta?.logMessages?.join("\n")).to.contain("withdraw 10000000 lamports");
    expect(result?.meta?.computeUnitsConsumed).to.be.lessThan(30_000);
  });
});
