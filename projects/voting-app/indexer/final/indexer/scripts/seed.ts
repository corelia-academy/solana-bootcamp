import anchor from "@anchor-lang/core";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import idl from "../idl/voting.json" with { type: "json" };

const { BN, web3 } = anchor;
const connection = new web3.Connection(process.env.RPC_URL ?? "http://127.0.0.1:8899", "confirmed");
const walletPath = (process.env.ANCHOR_WALLET ?? "~/.config/solana/bootcamp-devnet.json").replace("~", homedir());
const payer = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), { commitment: "confirmed" });
const program = new anchor.Program(idl as anchor.Idl, provider);

const pollId = new BN(Date.now());
const now = Math.floor(Date.now() / 1000);
const [poll] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("poll"), payer.publicKey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
  program.programId,
);
await program.methods
  .initializePoll(pollId, "Ngôn ngữ yêu thích", new BN(now + 3), new BN(now + 3600))
  .accounts({ authority: payer.publicKey })
  .rpc();
for (const [id, name] of [[1, "Rust"], [2, "TypeScript"]] as const) {
  await program.methods.addCandidate(pollId, id, name).accounts({ poll, authority: payer.publicKey }).rpc();
}

await new Promise((resolve) => setTimeout(resolve, 4000));
const count = Number(process.env.VOTES ?? "5");
for (let i = 0; i < count; i++) {
  const voter = web3.Keypair.generate();
  const airdrop = await connection.requestAirdrop(voter.publicKey, web3.LAMPORTS_PER_SOL / 10);
  await connection.confirmTransaction(airdrop, "confirmed");
  const candidateId = i % 3 === 2 ? 2 : 1;
  await program.methods.vote(pollId, candidateId).accounts({ poll, voter: voter.publicKey }).signers([voter]).rpc();
}
console.log(`Poll ${poll.toBase58()}: ${count} phiếu`);
