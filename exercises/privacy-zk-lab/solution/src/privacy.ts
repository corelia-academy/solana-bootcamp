import { createHash } from "node:crypto";

export const TREE_DEPTH = 2;
export const TREE_LEAF_COUNT = 1 << TREE_DEPTH;

export type PrivateNote = {
  secret: string;
  salt: string;
  amount: bigint;
};

export type MerkleProof = {
  leafIndex: number;
  siblings: string[];
};

export type SpendWitness = {
  inputNote: PrivateNote;
  outputNote: PrivateNote;
  merkleProof: MerkleProof;
};

export type PublicSpend = {
  inputCommitment: string;
  currentRoot: string;
  nullifier: string;
  outputCommitment: string;
  programId: string;
  domain: string;
};

function encodePart(value: string): string {
  return `${Buffer.byteLength(value, "utf8")}:${value}`;
}

function hash(domain: string, ...values: string[]): string {
  const encoded = [domain, ...values].map(encodePart).join("|");
  return createHash("sha256").update(encoded, "utf8").digest("hex");
}

function requireNonEmpty(label: string, value: string): void {
  if (value.length === 0) throw new Error(`${label.toUpperCase()}_EMPTY`);
}

function requireAmount(amount: bigint): void {
  if (amount <= 0n) throw new Error("INVALID_AMOUNT");
}

export function createCommitment(note: PrivateNote): string {
  requireNonEmpty("secret", note.secret);
  requireNonEmpty("salt", note.salt);
  requireAmount(note.amount);
  return hash("privacy-note-v1", note.secret, note.salt, note.amount.toString(10));
}

export function createNullifier(
  secret: string,
  noteIndex: number,
  programId: string,
  domain: string,
): string {
  requireNonEmpty("secret", secret);
  requireNonEmpty("program_id", programId);
  requireNonEmpty("domain", domain);
  if (!Number.isSafeInteger(noteIndex) || noteIndex < 0 || noteIndex >= TREE_LEAF_COUNT) {
    throw new Error("INVALID_NOTE_INDEX");
  }
  return hash("privacy-nullifier-v1", secret, noteIndex.toString(10), programId, domain);
}

function hashNode(left: string, right: string): string {
  return hash("privacy-merkle-node-v1", left, right);
}

export function buildMerkleRoot(leaves: readonly string[]): string {
  if (leaves.length !== TREE_LEAF_COUNT) throw new Error("INVALID_LEAF_COUNT");
  let level = [...leaves];
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      next.push(hashNode(level[index]!, level[index + 1]!));
    }
    level = next;
  }
  return level[0]!;
}

export function buildMerkleProof(leaves: readonly string[], leafIndex: number): MerkleProof {
  if (leaves.length !== TREE_LEAF_COUNT) throw new Error("INVALID_LEAF_COUNT");
  if (!Number.isSafeInteger(leafIndex) || leafIndex < 0 || leafIndex >= leaves.length) {
    throw new Error("INVALID_NOTE_INDEX");
  }

  const siblings: string[] = [];
  let index = leafIndex;
  let level = [...leaves];
  while (level.length > 1) {
    siblings.push(level[index ^ 1]!);
    const next: string[] = [];
    for (let cursor = 0; cursor < level.length; cursor += 2) {
      next.push(hashNode(level[cursor]!, level[cursor + 1]!));
    }
    level = next;
    index = Math.floor(index / 2);
  }
  return { leafIndex, siblings };
}

export function computeRootFromProof(leaf: string, proof: MerkleProof): string {
  if (
    proof.siblings.length !== TREE_DEPTH ||
    !Number.isSafeInteger(proof.leafIndex) ||
    proof.leafIndex < 0 ||
    proof.leafIndex >= TREE_LEAF_COUNT
  ) {
    throw new Error("INVALID_MERKLE_PROOF");
  }

  let current = leaf;
  let index = proof.leafIndex;
  for (const sibling of proof.siblings) {
    current = index % 2 === 0 ? hashNode(current, sibling) : hashNode(sibling, current);
    index = Math.floor(index / 2);
  }
  return current;
}

export function verifySpendRelation(publicSpend: PublicSpend, witness: SpendWitness): void {
  requireNonEmpty("program_id", publicSpend.programId);
  requireNonEmpty("domain", publicSpend.domain);

  const inputCommitment = createCommitment(witness.inputNote);
  if (inputCommitment !== publicSpend.inputCommitment) throw new Error("COMMITMENT_MISMATCH");

  const root = computeRootFromProof(inputCommitment, witness.merkleProof);
  if (root !== publicSpend.currentRoot) throw new Error("MERKLE_ROOT_MISMATCH");

  const nullifier = createNullifier(
    witness.inputNote.secret,
    witness.merkleProof.leafIndex,
    publicSpend.programId,
    publicSpend.domain,
  );
  if (nullifier !== publicSpend.nullifier) throw new Error("NULLIFIER_MISMATCH");

  if (witness.inputNote.amount !== witness.outputNote.amount) {
    throw new Error("VALUE_NOT_CONSERVED");
  }

  const outputCommitment = createCommitment(witness.outputNote);
  if (outputCommitment !== publicSpend.outputCommitment) {
    throw new Error("OUTPUT_COMMITMENT_MISMATCH");
  }
}

export class PrivacyState {
  readonly #usedNullifiers = new Set<string>();
  readonly #outputCommitments: string[] = [];

  constructor(readonly currentRoot: string) {
    requireNonEmpty("current_root", currentRoot);
  }

  get outputCommitments(): readonly string[] {
    return [...this.#outputCommitments];
  }

  hasConsumed(nullifier: string): boolean {
    return this.#usedNullifiers.has(nullifier);
  }

  consume(publicSpend: PublicSpend, witness: SpendWitness): void {
    if (publicSpend.currentRoot !== this.currentRoot) throw new Error("STALE_ROOT");
    if (this.#usedNullifiers.has(publicSpend.nullifier)) throw new Error("NULLIFIER_REPLAY");

    // Verify everything before mutating either collection. This models transaction atomicity.
    verifySpendRelation(publicSpend, witness);
    this.#usedNullifiers.add(publicSpend.nullifier);
    this.#outputCommitments.push(publicSpend.outputCommitment);
  }
}
