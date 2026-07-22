export function toBaseUnits(amount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimals không hợp lệ");
  if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error("amount phải là số dương dạng thập phân");

  const [whole, fraction = ""] = amount.split(".");
  if (fraction.length > decimals) throw new Error("amount có quá nhiều chữ số thập phân");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
}

export function assertSupplyInvariant(supply: bigint, balances: bigint[]): void {
  const total = balances.reduce((sum, balance) => sum + balance, 0n);
  if (supply !== total) throw new Error(`supply ${supply} khác tổng balance ${total}`);
}
