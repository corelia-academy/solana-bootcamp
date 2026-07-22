import { createHash } from "node:crypto";

const hash = (...values: string[]) => createHash("sha256").update(values.join(":"), "utf8").digest("hex");

export type PublicInputs = { commitment: string; nullifier: string; merkleRoot: string };
export type MockProof = { digest: string };

export function createCommitment(secret: string, salt: string): string {
  if (!secret || !salt) throw new Error("secret và salt không được rỗng");
  return hash("commitment", secret, salt);
}

export function createNullifier(secret: string, context: string): string {
  if (!context) throw new Error("context không được rỗng");
  return hash("nullifier", secret, context);
}

// Mock proof chỉ mô phỏng binding giữa proof và public inputs; không có ZK soundness.
export function createMockProof(inputs: PublicInputs): MockProof {
  return { digest: hash("mock-proof", inputs.commitment, inputs.nullifier, inputs.merkleRoot) };
}

export class NullifierVerifier {
  readonly #used = new Set<string>();

  verifyAndConsume(inputs: PublicInputs, proof: MockProof): void {
    const expected = createMockProof(inputs).digest;
    if (proof.digest !== expected) throw new Error("INVALID_PROOF");
    if (this.#used.has(inputs.nullifier)) throw new Error("NULLIFIER_REPLAY");
    this.#used.add(inputs.nullifier);
  }
}
