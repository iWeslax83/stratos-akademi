export type CleanResult = { ok: true; value: string } | { ok: false; error: string };

const MIN = 2;
const MAX = 60;

/** Görünen adı temizler/doğrular: kırp, iç boşlukları teke indir, uzunluk sınırı. */
export function cleanDisplayName(input: string): CleanResult {
  const value = (input ?? "").trim().replace(/\s+/g, " ");
  const len = Array.from(value).length; // unicode-doğru uzunluk
  if (len === 0) return { ok: false, error: "Ad boş olamaz." };
  if (len < MIN) return { ok: false, error: `Ad en az ${MIN} karakter olmalı.` };
  if (len > MAX) return { ok: false, error: `Ad en fazla ${MAX} karakter olabilir.` };
  return { ok: true, value };
}
