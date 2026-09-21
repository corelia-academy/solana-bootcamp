import anchor from "@anchor-lang/core";
import idl from "../idl/voting.json" with { type: "json" };
import type { RawTx } from "../src/decode.ts";

const coder = new anchor.BorshCoder(idl as anchor.Idl);
const discriminator = Buffer.from(idl.events[0].discriminator);

export const poll = anchor.web3.Keypair.generate().publicKey;
export const candidates = [1, 2].map(() => anchor.web3.Keypair.generate().publicKey);

export function voteLog(candidateId: number, votes: number) {
  const body = coder.types.encode("VoteCast", {
    version: 1,
    poll,
    candidate: candidates[candidateId - 1],
    voter: anchor.web3.Keypair.generate().publicKey,
    candidate_id: candidateId,
    votes: new anchor.BN(votes),
    timestamp: new anchor.BN(1_700_000_000),
  });
  return `Program data: ${Buffer.concat([discriminator, body]).toString("base64")}`;
}

export function voteTx(signature: string, slot: number, ...dataLogs: string[]): RawTx {
  const logs = [
    `Program ${idl.address} invoke [1]`,
    "Program log: Instruction: Vote",
    ...dataLogs,
    `Program ${idl.address} success`,
  ];
  return { signature, slot, blockTime: 1_700_000_000, logs };
}
