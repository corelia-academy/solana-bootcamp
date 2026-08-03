import type { web3 } from "@anchor-lang/core";
import type { RawTx } from "../src/decode.ts";

type Opts = { before?: string; until?: string; limit?: number };

export class FakeChain {
  txs: (RawTx & { err: unknown })[] = [];

  add(tx: RawTx, err: unknown = null) {
    this.txs.push({ ...tx, err });
  }

  async getSignaturesForAddress(_address: unknown, { before, until, limit = 1000 }: Opts) {
    let newestFirst = [...this.txs].reverse();
    const at = (signature?: string) => newestFirst.findIndex((t) => t.signature === signature);
    if (at(before) >= 0) newestFirst = newestFirst.slice(at(before) + 1);
    if (at(until) >= 0) newestFirst = newestFirst.slice(0, at(until));
    return newestFirst.slice(0, limit).map((t) => ({ signature: t.signature, slot: t.slot, err: t.err }));
  }

  async getTransaction(signature: string) {
    const tx = this.txs.find((t) => t.signature === signature);
    return tx && { slot: tx.slot, blockTime: tx.blockTime, meta: { err: tx.err, logMessages: tx.logs } };
  }

  asConnection() {
    return this as unknown as web3.Connection;
  }
}
