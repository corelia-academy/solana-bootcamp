import { describe, expect, it } from "vitest";
import { NullifierVerifier, createCommitment, createMockProof, createNullifier } from "../src/privacy.js";

describe("privacy flow mock", () => {
  const inputs = { commitment: createCommitment("secret", "salt"), nullifier: createNullifier("secret", "vote:42"), merkleRoot: "root-v1" };

  it("accept proof bound với public inputs", () => {
    expect(() => new NullifierVerifier().verifyAndConsume(inputs, createMockProof(inputs))).not.toThrow();
  });

  it("reject public input bị thay", () => {
    expect(() => new NullifierVerifier().verifyAndConsume({ ...inputs, merkleRoot: "evil-root" }, createMockProof(inputs))).toThrow("INVALID_PROOF");
  });

  it("reject nullifier replay", () => {
    const verifier = new NullifierVerifier();
    verifier.verifyAndConsume(inputs, createMockProof(inputs));
    expect(() => verifier.verifyAndConsume(inputs, createMockProof(inputs))).toThrow("NULLIFIER_REPLAY");
  });
});
