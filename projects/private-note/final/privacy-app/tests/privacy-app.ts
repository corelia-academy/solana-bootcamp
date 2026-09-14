import * as anchor from "@anchor-lang/core";
import { expect } from "chai";

const bytes = (fill: number): number[] => Array.from(Buffer.alloc(32, fill));

describe("privacy verifier boundary", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL.
  const mockVerifier: any = anchor.workspace.mockVerifier;
  const privacyApp: any = anchor.workspace.privacyApp;
  const authority = provider.wallet.publicKey;
  const systemProgram = anchor.web3.SystemProgram.programId;

  const domain = bytes(1);
  const root = bytes(2);
  const output = bytes(3);

  const [state] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), authority.toBuffer()],
    privacyApp.programId,
  );

  before(async () => {
    await privacyApp.methods
      .initializeState(domain, root)
      .accounts({ authority, state, systemProgram })
      .rpc();
  });

  function verifiedContext(nf: number[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("verified"), authority.toBuffer(), Buffer.from(nf)],
      mockVerifier.programId,
    )[0];
  }

  function nullifierRecord(nf: number[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), state.toBuffer(), Buffer.from(nf)],
      privacyApp.programId,
    )[0];
  }

  function verify(nf: number[]) {
    return mockVerifier.methods
      .verifyFixture(root, nf, output, domain)
      .accounts({ authority, verifiedContext: verifiedContext(nf), systemProgram })
      .rpc();
  }

  function consumeAccounts(nf: number[]) {
    return {
      authority,
      state,
      nullifierRecord: nullifierRecord(nf),
      verifiedContext: verifiedContext(nf),
      verifierProgram: mockVerifier.programId,
      systemProgram,
    };
  }

  async function expectFailure(promise: Promise<unknown>, text: string) {
    try {
      await promise;
      expect.fail(`phải thất bại với: ${text}`);
    } catch (error) {
      expect(String(error)).to.contain(text);
    }
  }

  it("consumes a verified note exactly once", async () => {
    const nf = bytes(4);
    await verify(nf);
    await privacyApp.methods
      .consumeNote(root, nf, output, domain)
      .accounts(consumeAccounts(nf))
      .rpc();

    const stored = await privacyApp.account.privacyState.fetch(state);
    expect(stored.outputsCount.toNumber()).to.equal(1);
    expect(stored.latestOutputCommitment).to.deep.equal(output);

    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(consumeAccounts(nf)).rpc(),
      "already in use",
    );
  });

  it("rolls back when public inputs do not match the context", async () => {
    const nf = bytes(5);
    await verify(nf);
    await expectFailure(
      privacyApp.methods
        .consumeNote(root, nf, bytes(9), domain)
        .accounts(consumeAccounts(nf))
        .rpc(),
      "Verified context output commitment does not match",
    );
    expect(await provider.connection.getAccountInfo(nullifierRecord(nf))).to.equal(null);
  });

  it("rejects a stale root and a different domain", async () => {
    const nf = bytes(6);
    await verify(nf);
    await expectFailure(
      privacyApp.methods.consumeNote(bytes(8), nf, output, domain).accounts(consumeAccounts(nf)).rpc(),
      "Spend root is not the current root",
    );
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, bytes(8)).accounts(consumeAccounts(nf)).rpc(),
      "Spend domain does not match state",
    );
  });

  it("rejects a fake verifier and a fake context", async () => {
    const nf = bytes(7);
    await verify(nf);
    const fakeVerifier = { ...consumeAccounts(nf), verifierProgram: privacyApp.programId };
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(fakeVerifier).rpc(),
      "verifier_program",
    );
    const fakeContext = { ...consumeAccounts(nf), verifiedContext: state };
    await expectFailure(
      privacyApp.methods.consumeNote(root, nf, output, domain).accounts(fakeContext).rpc(),
      "verified_context",
    );
  });
});
