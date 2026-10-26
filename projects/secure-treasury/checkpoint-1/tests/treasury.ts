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
});
