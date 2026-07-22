import { describe, expect, it } from "vitest";
import { ForecastMarket } from "../src/market.js";

describe("forecast market dùng điểm giả lập", () => {
  it("open → resolved → claim", () => {
    const market = new ForecastMarket("admin", 100);
    market.participate("alice", "YES", 10, 50);
    market.resolve("admin", "YES", 100);
    expect(market.claim("alice")).toBe(10);
  });
  it("reject participation sau close và unauthorized resolve", () => {
    const market = new ForecastMarket("admin", 100);
    expect(() => market.participate("alice", "YES", 10, 100)).toThrow("MARKET_CLOSED");
    expect(() => market.resolve("attacker", "YES", 100)).toThrow("UNAUTHORIZED");
  });
  it("reject duplicate claim", () => {
    const market = new ForecastMarket("admin", 100);
    market.participate("alice", "NO", 5, 1); market.resolve("admin", "NO", 100); market.claim("alice");
    expect(() => market.claim("alice")).toThrow("ALREADY_CLAIMED");
  });
});
