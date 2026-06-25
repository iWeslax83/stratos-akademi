import { describe, it, expect } from "vitest";
import { seededShuffle, shuffleQuiz } from "@/lib/quiz/shuffle";
import type { Quiz } from "@/lib/quiz/types";

describe("seededShuffle", () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("aynı seed → aynı sıra (determinist)", () => {
    expect(seededShuffle(arr, 42)).toEqual(seededShuffle(arr, 42));
  });

  it("permütasyon: aynı elemanlar, sıra değişebilir", () => {
    const r = seededShuffle(arr, 42);
    expect([...r].sort((a, b) => a - b)).toEqual(arr);
  });

  it("girdiyi değiştirmez", () => {
    const copy = [...arr];
    seededShuffle(arr, 7);
    expect(arr).toEqual(copy);
  });

  it("farklı seed'ler farklı sıra üretir (uzun dizi)", () => {
    expect(seededShuffle(arr, 1)).not.toEqual(seededShuffle(arr, 2));
  });
});

describe("shuffleQuiz", () => {
  const quiz: Quiz = {
    id: "q",
    module_id: "m",
    baslik: "Test",
    gecme_esigi: 70,
    questions: [
      { id: "s1", metin: "soru1", sira: 0, options: [
        { id: "o1", metin: "a", sira: 0 }, { id: "o2", metin: "b", sira: 1 }, { id: "o3", metin: "c", sira: 2 },
      ] },
      { id: "s2", metin: "soru2", sira: 1, options: [
        { id: "o4", metin: "d", sira: 0 }, { id: "o5", metin: "e", sira: 1 },
      ] },
    ],
  };

  it("soru id kümesini korur", () => {
    const s = shuffleQuiz(quiz, 3);
    expect(s.questions.map((q) => q.id).sort()).toEqual(["s1", "s2"]);
  });

  it("her sorunun şık id kümesini korur", () => {
    const s = shuffleQuiz(quiz, 3);
    const byId = new Map(s.questions.map((q) => [q.id, q.options.map((o) => o.id).sort()]));
    expect(byId.get("s1")).toEqual(["o1", "o2", "o3"]);
    expect(byId.get("s2")).toEqual(["o4", "o5"]);
  });

  it("determinist (aynı seed → aynı yapı)", () => {
    expect(shuffleQuiz(quiz, 9)).toEqual(shuffleQuiz(quiz, 9));
  });

  it("orijinal quiz nesnesini değiştirmez", () => {
    const before = JSON.stringify(quiz);
    shuffleQuiz(quiz, 5);
    expect(JSON.stringify(quiz)).toBe(before);
  });
});
