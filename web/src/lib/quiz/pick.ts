import { seededShuffle } from "./shuffle";

// Bir denemede gösterilen (ve puanlanan) soru sayısı. Havuz bundan küçükse hepsi sorulur.
export const QUIZ_SIZE = 10;

// Havuzdan seed'e göre sabit bir alt küme seçer. İstemci ve sunucu AYNI fonksiyonu çağırır:
// sunucu, istemcinin gönderdiği seed'den soru kümesini yeniden türetip yalnız onu puanlar,
// böylece üye kolay soruları seçip gönderemez.
export function pickQuestionIds(ids: string[], seed: number, size: number = QUIZ_SIZE): string[] {
  if (ids.length <= size) return ids.slice();
  return seededShuffle([...ids].sort(), seed).slice(0, size);
}

export function isValidSeed(seed: unknown): seed is number {
  return typeof seed === "number" && Number.isInteger(seed) && seed >= 0 && seed <= 2147483647;
}
