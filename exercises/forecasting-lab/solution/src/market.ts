export type Choice = "YES" | "NO";
export type Position = { user: string; choice: Choice; points: number; claimed: boolean };

export class ForecastMarket {
  readonly #positions = new Map<string, Position>();
  #outcome?: Choice;
  constructor(readonly authority: string, readonly closesAt: number) {
    if (!authority || closesAt <= 0) throw new Error("INVALID_MARKET");
  }

  participate(user: string, choice: Choice, points: number, now: number): void {
    if (now >= this.closesAt) throw new Error("MARKET_CLOSED");
    if (!Number.isInteger(points) || points <= 0) throw new Error("INVALID_POINTS");
    if (this.#positions.has(user)) throw new Error("POSITION_EXISTS");
    this.#positions.set(user, { user, choice, points, claimed: false });
  }

  resolve(caller: string, outcome: Choice, now: number): void {
    if (caller !== this.authority) throw new Error("UNAUTHORIZED");
    if (now < this.closesAt) throw new Error("MARKET_OPEN");
    if (this.#outcome) throw new Error("ALREADY_RESOLVED");
    this.#outcome = outcome;
  }

  claim(user: string): number {
    if (!this.#outcome) throw new Error("NOT_RESOLVED");
    const position = this.#positions.get(user);
    if (!position) throw new Error("POSITION_NOT_FOUND");
    if (position.claimed) throw new Error("ALREADY_CLAIMED");
    position.claimed = true;
    return position.choice === this.#outcome ? position.points : 0;
  }
}
