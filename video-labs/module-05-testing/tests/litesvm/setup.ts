import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { FailedTransactionMetadata, LiteSVM, TransactionMetadata } from "litesvm";
import * as fs from "node:fs";
import * as path from "node:path";

const WORKSPACE = path.resolve(__dirname, "../..");
const IDL_PATH = path.join(WORKSPACE, "target/idl/pda_counter.json");
const SO_PATH = path.join(WORKSPACE, "target/deploy/pda_counter.so");

export type Ctx = {
  svm: LiteSVM;
  program: anchor.Program<anchor.Idl>;
  programId: PublicKey;
  payer: Keypair;
  send: (tx: Transaction, signers: Keypair[]) => TransactionMetadata;
  expectSendFailure: (
    tx: Transaction,
    signers: Keypair[],
    pattern: RegExp,
  ) => FailedTransactionMetadata;
  airdrop: (pubkey: PublicKey, lamports?: bigint) => void;
  fetchCounter: (pda: PublicKey) => { owner: PublicKey; value: anchor.BN; bump: number };
  counterExists: (pda: PublicKey) => boolean;
};

const loadIdl = (): anchor.Idl => {
  if (!fs.existsSync(IDL_PATH)) {
    throw new Error(
      `Không tìm thấy IDL tại ${IDL_PATH}. Chạy \`pnpm run build\` trước khi test LiteSVM.`,
    );
  }
  return JSON.parse(fs.readFileSync(IDL_PATH, "utf8")) as anchor.Idl;
};

const loadProgramBytes = (): Buffer => {
  if (!fs.existsSync(SO_PATH)) {
    throw new Error(
      `Không tìm thấy program binary tại ${SO_PATH}. Chạy \`pnpm run build\` trước khi test LiteSVM.`,
    );
  }
  return fs.readFileSync(SO_PATH);
};

export const createCtx = (): Ctx => {
  const idl = loadIdl();
  const programId = new PublicKey((idl as unknown as { address: string }).address);

  const svm = new LiteSVM();
  svm.addProgram(programId, loadProgramBytes());

  const payer = Keypair.generate();
  svm.airdrop(payer.publicKey, BigInt(10 * anchor.web3.LAMPORTS_PER_SOL));

  const dummyConnection = new Connection("http://127.0.0.1:8899");
  const provider = new anchor.AnchorProvider(dummyConnection, new anchor.Wallet(payer), {
    commitment: "processed",
  });
  const program = new anchor.Program(idl, provider);

  const airdrop = (pubkey: PublicKey, lamports = BigInt(anchor.web3.LAMPORTS_PER_SOL)) => {
    svm.airdrop(pubkey, lamports);
  };

  const send = (tx: Transaction, signers: Keypair[]): TransactionMetadata => {
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = tx.feePayer ?? payer.publicKey;
    tx.sign(...signers);
    const result = svm.sendTransaction(tx);
    if (result instanceof FailedTransactionMetadata) {
      const logs = result.meta().logs().join("\n");
      throw new Error(`Transaction thất bại: ${result.err()}\n${logs}`);
    }
    return result;
  };

  const expectSendFailure = (
    tx: Transaction,
    signers: Keypair[],
    pattern: RegExp,
  ): FailedTransactionMetadata => {
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = tx.feePayer ?? payer.publicKey;
    tx.sign(...signers);
    const result = svm.sendTransaction(tx);
    if (!(result instanceof FailedTransactionMetadata)) {
      throw new Error("Transaction đáng lẽ phải thất bại nhưng đã thành công");
    }
    const detail = `${result.err()}\n${result.meta().logs().join("\n")}`;
    if (!pattern.test(detail)) {
      throw new Error(`Lỗi không khớp pattern ${pattern}. Nhận được:\n${detail}`);
    }
    return result;
  };

  const fetchCounter = (pda: PublicKey) => {
    const info = svm.getAccount(pda);
    if (!info) throw new Error(`Account ${pda.toBase58()} không tồn tại`);
    const data = Buffer.from(info.data);
    return program.coder.accounts.decode("counter", data) as {
      owner: PublicKey;
      value: anchor.BN;
      bump: number;
    };
  };

  const counterExists = (pda: PublicKey) => svm.getAccount(pda) !== null;

  return {
    svm,
    program,
    programId,
    payer,
    send,
    expectSendFailure,
    airdrop,
    fetchCounter,
    counterExists,
  };
};
