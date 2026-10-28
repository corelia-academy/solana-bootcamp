import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";

const bytes = (fill: number): number[] => Array.from(Buffer.alloc(32, fill));

describe("privacy verifier boundary", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const mockVerifier = anchor.workspace.MockVerifier as Program;
  const privacyApp = anchor.workspace.PrivacyApp as Program;
  const authority = provider.wallet.publicKey;

  const domain = bytes(1);
  const root = bytes(2);
  const output = bytes(3);
  const nullifier = bytes(4);

  const [state] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), authority.toBuffer()],
    privacyApp.programId,
  );

  const verifiedContext = (nf: number[]) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("verified"), authority.toBuffer(), Buffer.from(nf)],
      mockVerifier.programId,
    )[0];

  const nullifierRecord = (nf: number[]) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), state.toBuffer(), Buffer.from(nf)],
      privacyApp.programId,
    )[0];

  async function expectFailure(promise: Promise<unknown>, text: string): Promise<void> {
    try {
      await promise;
      expect.fail(`expected failure containing ${text}`);
    } catch (error) {
      expect(String(error)).to.contain(text);
    }
  }

  before(async () => {
    await privacyApp.methods
      .initializeState(domain, root)
      .accounts({ authority, state, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();
  });

  it("accepts a verifier-owned context and consumes once", async () => {
    const context = verifiedContext(nullifier);
    await mockVerifier.methods
      .verifyFixture(root, nullifier, output, domain)
      .accounts({
        authority,
        verifiedContext: context,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await privacyApp.methods
      .consumeNote(root, nullifier, output, domain)
      .accounts({
        authority,
        state,
        nullifierRecord: nullifierRecord(nullifier),
        verifiedContext: context,
        verifierProgram: mockVerifier.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const stored = await (privacyApp.account as any).privacyState.fetch(state);
    expect(stored.outputsCount.toNumber()).to.equal(1);
    expect(stored.latestOutputCommitment).to.deep.equal(output);

    await expectFailure(
      privacyApp.methods
        .consumeNote(root, nullifier, output, domain)
        .accounts({
          authority,
          state,
          nullifierRecord: nullifierRecord(nullifier),
          verifiedContext: context,
          verifierProgram: mockVerifier.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(),
      "already in use",
    );
  });

  it("rejects mismatched public inputs and rolls back nullifier creation", async () => {
    const nf = bytes(5);
    const context = verifiedContext(nf);
    await mockVerifier.methods
      .verifyFixture(root, nf, output, domain)
      .accounts({
        authority,
        verifiedContext: context,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const changedOutput = bytes(9);
    const record = nullifierRecord(nf);
    await expectFailure(
      privacyApp.methods
        .consumeNote(root, nf, changedOutput, domain)
        .accounts({
          authority,
          state,
          nullifierRecord: record,
          verifiedContext: context,
          verifierProgram: mockVerifier.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(),
      "Verified context output commitment does not match",
    );
    expect(await provider.connection.getAccountInfo(record)).to.equal(null);
  });

  it("rejects a stale root and mismatched domain", async () => {
    const nf = bytes(6);
    const context = verifiedContext(nf);
    await mockVerifier.methods
      .verifyFixture(root, nf, output, domain)
      .accounts({
        authority,
        verifiedContext: context,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const baseAccounts = {
      authority,
      state,
      nullifierRecord: nullifierRecord(nf),
      verifiedContext: context,
      verifierProgram: mockVerifier.programId,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    await expectFailure(
      privacyApp.methods.consumeNote(bytes(8), nf, output, domain).accounts(baseAccounts).rpc(),
      "Spend root is not the current root",
    );
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, bytes(8)).accounts(baseAccounts).rpc(),
      "Spend domain does not match state",
    );
  });

  it("rejects a fake verifier ID and fake context owner", async () => {
    const nf = bytes(7);
    const context = verifiedContext(nf);
    await mockVerifier.methods
      .verifyFixture(root, nf, output, domain)
      .accounts({
        authority,
        verifiedContext: context,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const accounts = {
      authority,
      state,
      nullifierRecord: nullifierRecord(nf),
      verifiedContext: context,
      verifierProgram: privacyApp.programId,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(accounts).rpc(),
      "verifier_program",
    );

    await expectFailure(
      privacyApp.methods
        .consumeNote(root, nf, output, domain)
        .accounts({
          ...accounts,
          verifiedContext: state,
          verifierProgram: mockVerifier.programId,
        })
        .rpc(),
      "verified_context",
    );
  });
});
