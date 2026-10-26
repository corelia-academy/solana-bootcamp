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
});
