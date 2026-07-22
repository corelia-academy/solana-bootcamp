export type Choice = "YES" | "NO";
export class ForecastMarket {
  constructor(readonly authority: string, readonly closesAt: number) {}
  participate(_user: string, _choice: Choice, _points: number, _now: number): void { throw new Error("TODO 1: open-market validation"); }
  resolve(_caller: string, _outcome: Choice, _now: number): void { throw new Error("TODO 2: one-time authority resolution"); }
  claim(_user: string): number { throw new Error("TODO 3: one-time fake-points claim"); }
}
