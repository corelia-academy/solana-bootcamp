import { PublicKey } from "@solana/web3.js";

export const COUNTER_SEED = Buffer.from("counter");

export const deriveCounter = (owner: PublicKey, programId: PublicKey): PublicKey =>
  PublicKey.findProgramAddressSync([COUNTER_SEED, owner.toBuffer()], programId)[0];

export const expectFailure = async (
  action: Promise<unknown>,
  pattern: RegExp,
  message = "Transaction đáng lẽ phải thất bại",
): Promise<void> => {
  try {
    await action;
    throw new Error(message);
  } catch (error) {
    const text = String(error);
    if (text === message) throw error;
    if (!pattern.test(text)) {
      throw new Error(`Lỗi không khớp pattern ${pattern}. Nhận được:\n${text}`);
    }
  }
};
