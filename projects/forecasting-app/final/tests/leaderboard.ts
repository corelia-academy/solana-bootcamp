import { expect } from "chai";
import { rankPlayers } from "../app/leaderboard";

describe("leaderboard", () => {
  const rows = [
    { user: "Cxyz", score: 300, points: 1000 },
    { user: "Aabc", score: 300, points: 1000 },
    { user: "Bdef", score: 500, points: 900 },
  ];

  it("xếp theo score rồi theo địa chỉ, không phụ thuộc thứ tự đầu vào", () => {
    const first = rankPlayers(rows, 1, 10).map((row) => row.user);
    const second = rankPlayers([...rows].reverse(), 1, 10).map((row) => row.user);
    expect(first).to.deep.equal(["Bdef", "Aabc", "Cxyz"]);
    expect(second).to.deep.equal(first);
  });

  it("chia trang và giữ đúng hạng", () => {
    const page2 = rankPlayers(rows, 2, 2);
    expect(page2).to.deep.equal([{ rank: 3, user: "Cxyz", score: 300, points: 1000 }]);
  });
});
