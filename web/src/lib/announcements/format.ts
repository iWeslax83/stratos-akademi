// Duyuru için saf yardımcılar. DB I/O yok; test edilebilir.

// Liste/kart için kısa önizleme: boşluk kırpılır, max'tan uzunsa "…" eklenir.
export function announcementExcerpt(icerik: string | null | undefined, max = 160): string {
  const s = (icerik ?? "").trim();
  if (s.length <= max) return s;
  // Kelime ortasında kesmemek için son boşluğa kadar geri al (mantıklıysa).
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.trimEnd() + "…";
}
