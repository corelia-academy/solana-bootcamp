import { describe, expect, it } from "vitest";
import {
  PrivacyState,
  buildMerkleProof,
  buildMerkleRoot,
  computeRootFromProof,
  createCommitment,
  createNullifier,
  verifySpendRelation,
  type PrivateNote,
  type PublicSpend,
  type SpendWitness,
} from "../src/privacy.js";

const inputNote: PrivateNote = { secret: "alice-secret", salt: "input-salt", amount: 10n };
const inputCommitment = createCommitment(inputNote);
const leaves = [
  createCommitment({ secret: "decoy-0", salt: "salt-0", amount: 3n }),
  inputCommitment,
  createCommitment({ secret: "decoy-2", salt: "salt-2", amount: 8n }),
  createCommitment({ secret: "decoy-3", salt: "salt-3", amount: 5n }),
];
const merkleProof = buildMerkleProof(leaves, 1);
const currentRoot = buildMerkleRoot(leaves);
const programId = "Privacy111111111111111111111111111111111";
const domain = "localnet:module-12:v1";
const outputNote: PrivateNote = { secret: "alice-next-secret", salt: "output-salt", amount: 10n };

function fixture(): { publicSpend: PublicSpend; witness: SpendWitness } {
  return {
    publicSpend: {
      currentRoot,
      nullifier: createNullifier(inputNote.secret, 1, programId, domain),
      outputCommitment: createCommitment(outputNote),
      programId,
      domain,
    },
    witness: { inputNote, outputNote, merkleProof },
  };
}

describe("createCommitment", () => {
  it("is deterministic and binds every field", () => {
    expect(createCommitment({ ...inputNote })).toBe(inputCommitment);
    expect(createCommitment({ ...inputNote, salt: "other-salt" })).not.toBe(inputCommitment);
    expect(createCommitment({ ...inputNote, amount: 11n })).not.toBe(inputCommitment);
  });

  it("rejects an empty secret and a zero amount", () => {
    expect(() => createCommitment({ ...inputNote, secret: "" })).toThrow("SECRET_EMPTY");
    expect(() => createCommitment({ ...inputNote, amount: 0n })).toThrow("INVALID_AMOUNT");
  });
});

describe("Merkle membership", () => {
  it("recomputes the root from leaf 1 and its path", () => {
    expect(merkleProof.siblings).toHaveLength(2);
    expect(computeRootFromProof(inputCommitment, merkleProof)).toBe(currentRoot);
  });

  it("gives another root for a wrong sibling or index", () => {
    const wrongSibling = { ...merkleProof, siblings: ["wrong", merkleProof.siblings[1]] };
    expect(computeRootFromProof(inputCommitment, wrongSibling)).not.toBe(currentRoot);
    const wrongIndex = { ...merkleProof, leafIndex: 0 };
    expect(computeRootFromProof(inputCommitment, wrongIndex)).not.toBe(currentRoot);
  });

  it("rejects an index outside the tree", () => {
    expect(() => buildMerkleProof(leaves, 4)).toThrow("INVALID_NOTE_INDEX");
  });
});

describe("private-note spend relation", () => {
  it("accepts a valid witness", () => {
    const { publicSpend, witness } = fixture();
    expect(() => verifySpendRelation(publicSpend, witness)).not.toThrow();
  });

  it.each([
    ["secret", { inputNote: { ...inputNote, secret: "wrong" } }, "MERKLE_ROOT_MISMATCH"],
    ["salt", { inputNote: { ...inputNote, salt: "wrong" } }, "MERKLE_ROOT_MISMATCH"],
    ["amount", { inputNote: { ...inputNote, amount: 11n } }, "MERKLE_ROOT_MISMATCH"],
    [
      "Merkle path",
      { merkleProof: { ...merkleProof, siblings: ["wrong", merkleProof.siblings[1]] } },
      "MERKLE_ROOT_MISMATCH",
    ],
  ])("rejects a changed %s", (_label, patch, error) => {
    const { publicSpend, witness } = fixture();
    expect(() => verifySpendRelation(publicSpend, { ...witness, ...patch })).toThrow(error);
  });

  it("rejects a changed root or domain", () => {
    const { publicSpend, witness } = fixture();
    expect(() =>
      verifySpendRelation({ ...publicSpend, currentRoot: "wrong-root" }, witness),
    ).toThrow("MERKLE_ROOT_MISMATCH");
    expect(() => verifySpendRelation({ ...publicSpend, domain: "devnet:v1" }, witness)).toThrow(
      "NULLIFIER_MISMATCH",
    );
  });

  it("rejects output inflation", () => {
    const { publicSpend, witness } = fixture();
    const inflated = { ...witness, outputNote: { ...outputNote, amount: 11n } };
    expect(() => verifySpendRelation(publicSpend, inflated)).toThrow("VALUE_NOT_CONSERVED");
  });
});

describe("PrivacyState.consume", () => {
  it("consumes once and records the output", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState(currentRoot);
    state.consume(publicSpend, witness);

    expect(state.hasConsumed(publicSpend.nullifier)).toBe(true);
    expect(state.outputCommitments).toEqual([publicSpend.outputCommitment]);
    expect(() => state.consume(publicSpend, witness)).toThrow("NULLIFIER_REPLAY");
  });

  it("does not mutate state when verification fails", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState(currentRoot);
    const invalid = { ...witness, outputNote: { ...outputNote, amount: 11n } };

    expect(() => state.consume(publicSpend, invalid)).toThrow("VALUE_NOT_CONSERVED");
    expect(state.hasConsumed(publicSpend.nullifier)).toBe(false);
    expect(state.outputCommitments).toEqual([]);
  });

  it("rejects a stale root before mutation", () => {
    const { publicSpend, witness } = fixture();
    const state = new PrivacyState("new-root");
    expect(() => state.consume(publicSpend, witness)).toThrow("STALE_ROOT");
    expect(state.outputCommitments).toEqual([]);
  });
});
