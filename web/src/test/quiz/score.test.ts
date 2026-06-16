import { describe, it, expect } from "vitest";
import { scoreQuiz } from "@/lib/quiz/score";
import type { ScorableQuestion, AnswerMap } from "@/lib/quiz/types";

const qs: ScorableQuestion[] = [
  { id: "q1", correctOptionIds: ["a"] },
  { id: "q2", correctOptionIds: ["x", "y"] },
];

describe("scoreQuiz", () => {
  it("hepsi doğru → %100, geçti", () => {
    const ans: AnswerMap = { q1: ["a"], q2: ["x", "y"] };
    expect(scoreQuiz(qs, ans, 70)).toEqual({
      puan: 100,
      gecti: true,
      perQuestion: [
        { questionId: "q1", dogruMu: true },
        { questionId: "q2", dogruMu: true },
      ],
    });
  });
  it("çok-doğruda eksik seçim yanlış", () => {
    const r = scoreQuiz(qs, { q1: ["a"], q2: ["x"] }, 70);
    expect(r.puan).toBe(50);
    expect(r.gecti).toBe(false);
  });
  it("çok-doğruda fazla seçim yanlış", () => {
    const r = scoreQuiz(qs, { q1: ["a"], q2: ["x", "y", "z"] }, 70);
    expect(r.perQuestion[1].dogruMu).toBe(false);
  });
  it("boş cevap yanlış sayılır", () => {
    const r = scoreQuiz(qs, {}, 70);
    expect(r.puan).toBe(0);
  });
  it("eşik tam sınırda geçer", () => {
    expect(scoreQuiz(qs, { q1: ["a"], q2: ["x"] }, 50).gecti).toBe(true);
  });
  it("soru yoksa puan 0, geçti değil", () => {
    expect(scoreQuiz([], {}, 70)).toEqual({ puan: 0, gecti: false, perQuestion: [] });
  });
});
