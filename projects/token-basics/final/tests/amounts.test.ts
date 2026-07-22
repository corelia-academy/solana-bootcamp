import { describe, expect, it } from "vitest";
import { assertSupplyInvariant, toBaseUnits } from "../src/amounts.js";

describe("token amounts", () => {
  it("chuyển UI amount sang base units mà không dùng float", () => {
    expect(toBaseUnits("25.125", 6)).toBe(25_125_000n);
  });

  it("từ chối precision vượt decimals", () => {
    expect(() => toBaseUnits("1.0000001", 6)).toThrow(/quá nhiều/);
  });

  it("kiểm tra supply bằng tổng token accounts", () => {
    expect(() => assertSupplyInvariant(95n, [75n, 20n])).not.toThrow();
    expect(() => assertSupplyInvariant(96n, [75n, 20n])).toThrow(/khác/);
  });
});
