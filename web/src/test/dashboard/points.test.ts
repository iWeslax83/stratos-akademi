import { describe, it, expect } from "vitest";
import { computePoints } from "@/lib/dashboard/points";

describe("computePoints", () => {
  it("ders yok, quiz yok → 0", () => {
    expect(computePoints(0, [])).toBe(0);
  });
  it("8 ders × 20 + [90,75] → 325", () => {
    expect(computePoints(8, [90, 75])).toBe(325);
  });
  it("sadece dersler", () => {
    expect(computePoints(8, [])).toBe(160);
  });
  it("sadece quizler", () => {
    expect(computePoints(0, [90, 75])).toBe(165);
  });
  it("onaylı görev puanı eklenir", () => {
    expect(computePoints(8, [90, 75], 60)).toBe(385);
    expect(computePoints(0, [], 30)).toBe(30);
  });
});
