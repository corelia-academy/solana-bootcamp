import * as anchor from "@anchor-lang/core";
import BN from "bn.js";
import { expect } from "chai";

describe("treasury", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // `any` để test compile được trước khi có type sinh từ IDL (target/types/treasury.ts).
  const program: any = anchor.workspace.treasury;
  const connection = provider.connection;
  const { Keypair, PublicKey, SystemProgram, Transaction } = anchor.web3;

  const admin = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const carol = Keypair.generate();
  const recipient = Keypair.generate().publicKey;
});
