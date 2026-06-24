import { describe, it, expect } from "vitest";
import { bestScoresPerQuiz, sumApprovedTaskPoints } from "@/lib/dashboard/aggregate";

describe("bestScoresPerQuiz", () => {
  it("boş → []", () => {
    expect(bestScoresPerQuiz([])).toEqual([]);
  });

  it("aynı quiz'in en iyi denemesini alır", () => {
    const r = bestScoresPerQuiz([
      { quiz_id: "q1", puan: 60 },
      { quiz_id: "q1", puan: 90 },
      { quiz_id: "q1", puan: 75 },
    ]);
    expect(r).toEqual([90]);
  });

  it("birden çok quiz → quiz başına en iyi", () => {
    const r = bestScoresPerQuiz([
      { quiz_id: "q1", puan: 50 },
      { quiz_id: "q2", puan: 80 },
      { quiz_id: "q1", puan: 100 },
    ]);
    expect(r.sort((a, b) => a - b)).toEqual([80, 100]);
  });
});

describe("sumApprovedTaskPoints", () => {
  it("boş → 0", () => {
    expect(sumApprovedTaskPoints([])).toBe(0);
  });

  it("nesne şekli (tek join)", () => {
    expect(sumApprovedTaskPoints([{ practical_tasks: { puan: 30 } }])).toBe(30);
  });

  it("dizi şekli (Supabase join bazen dizi döner)", () => {
    expect(sumApprovedTaskPoints([{ practical_tasks: [{ puan: 25 }] }])).toBe(25);
  });

  it("null / boş dizi / eksik puan → 0 katkı", () => {
    expect(
      sumApprovedTaskPoints([
        { practical_tasks: null },
        { practical_tasks: [] },
      ]),
    ).toBe(0);
  });

  it("karışık satırları toplar", () => {
    expect(
      sumApprovedTaskPoints([
        { practical_tasks: { puan: 10 } },
        { practical_tasks: [{ puan: 20 }] },
        { practical_tasks: null },
        { practical_tasks: { puan: 5 } },
      ]),
    ).toBe(35);
  });
});
