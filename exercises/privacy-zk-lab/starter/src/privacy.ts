import { createHash } from "node:crypto";

export const TREE_DEPTH = 2;
export const TREE_LEAF_COUNT = 1 << TREE_DEPTH;

export type PrivateNote = { secret: string; salt: string; amount: bigint };
export type MerkleProof = { leafIndex: number; siblings: string[] };
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

// Helper đã cho sẵn để bài tập tập trung vào relation, không tập trung vào Node crypto API.
const hash = (domain: string, ...values: string[]): string =>
  createHash("sha256")
    .update([domain, ...values].map((value) => `${Buffer.byteLength(value)}:${value}`).join("|"))
    .digest("hex");

const hashNode = (left: string, right: string): string =>
  hash("privacy-merkle-node-v1", left, right);

export function createCommitment(_note: PrivateNote): string {
  throw new Error("TODO 1: bind secret, salt và amount với commitment domain");
}

export function createNullifier(
  _secret: string,
  _noteIndex: number,
  _programId: string,
  _domain: string,
): string {
  throw new Error("TODO 2: bind note với program/deployment domain");
}

export function buildMerkleRoot(_leaves: readonly string[]): string {
  throw new Error("TODO 3: hash tree bốn leaves theo từng cặp");
}

export function buildMerkleProof(
  _leaves: readonly string[],
  _leafIndex: number,
): MerkleProof {
  throw new Error("TODO 4: thu thập sibling ở mỗi tree level");
}

export function computeRootFromProof(_leaf: string, _proof: MerkleProof): string {
  throw new Error("TODO 5: dùng index bits để giữ đúng thứ tự left/right");
}

export function verifySpendRelation(_publicSpend: PublicSpend, _witness: SpendWitness): void {
  throw new Error(
    "TODO 6: verify commitment, membership, nullifier, output và value conservation",
  );
}

export class PrivacyState {
  readonly #usedNullifiers = new Set<string>();
  readonly #outputCommitments: string[] = [];

  constructor(readonly currentRoot: string) {}

  get outputCommitments(): readonly string[] {
    return [...this.#outputCommitments];
  }

  hasConsumed(nullifier: string): boolean {
    return this.#usedNullifiers.has(nullifier);
  }

  consume(_publicSpend: PublicSpend, _witness: SpendWitness): void {
    throw new Error("TODO 7: verify mọi invariant trước khi mutate state");
  }
}

// Giữ helper được tham chiếu để TypeScript báo lỗi nếu học viên vô tình xóa nó.
void hashNode;
