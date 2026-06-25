import type { Quiz } from "./types";

// Determinist PRNG (mulberry32) — aynı seed → aynı sıra (test edilebilir).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Yeni dizi döner (girdiyi DEĞİŞTİRMEZ); seed'e göre Fisher-Yates karıştırma.
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Soru sırasını ve her sorunun şık sırasını karıştırır (görünüm; puanlama ID bazlı, etkilenmez).
// Her sorunun şıkları farklı türetilmiş seed'le karışır ki hepsi aynı desende olmasın.
export function shuffleQuiz(quiz: Quiz, seed: number): Quiz {
  const questions = seededShuffle(quiz.questions, seed).map((q, i) => ({
    ...q,
    options: seededShuffle(q.options, seed + i + 1),
  }));
  return { ...quiz, questions };
}
