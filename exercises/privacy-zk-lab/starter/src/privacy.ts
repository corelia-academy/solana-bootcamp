export type PublicInputs = { commitment: string; nullifier: string; merkleRoot: string };
export type MockProof = { digest: string };

export function createCommitment(_secret: string, _salt: string): string { throw new Error("TODO 1: bind secret và salt"); }
export function createNullifier(_secret: string, _context: string): string { throw new Error("TODO 2: bind secret và context"); }
export function createMockProof(_inputs: PublicInputs): MockProof { throw new Error("TODO 3: bind proof với public inputs"); }
export class NullifierVerifier { verifyAndConsume(_inputs: PublicInputs, _proof: MockProof): void { throw new Error("TODO 4: verify và chặn replay"); } }
