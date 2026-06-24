import { describe, it, expect } from "vitest";
import { computePoints, pointsBreakdown } from "@/lib/dashboard/points";

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

describe("pointsBreakdown", () => {
  it("parçalar ve toplam doğru", () => {
    const b = pointsBreakdown(8, [90, 75], 60);
    expect(b.ders).toBe(160);
    expect(b.quiz).toBe(165);
    expect(b.gorev).toBe(60);
    expect(b.toplam).toBe(385);
  });
  it("toplam computePoints ile aynı", () => {
    expect(pointsBreakdown(8, [90, 75], 60).toplam).toBe(computePoints(8, [90, 75], 60));
    expect(pointsBreakdown(3, [], 0).toplam).toBe(computePoints(3, [], 0));
  });
  it("görev puanı varsayılan 0", () => {
    expect(pointsBreakdown(2, [50]).gorev).toBe(0);
    expect(pointsBreakdown(2, [50]).toplam).toBe(90);
  });
});
