export function toBaseUnits(amount: string, decimals: number): bigint {
  void amount;
  void decimals;
  throw new Error("TODO 1: chuyển UI amount sang base units mà không dùng Number/float");
}

export function assertSupplyInvariant(supply: bigint, balances: bigint[]): void {
  void supply;
  void balances;
  throw new Error("TODO 2: kiểm tra supply bằng tổng balances");
}
