export type SonucTuru = "ders" | "modul" | "dal" | "duyuru" | "etkinlik" | "kaynak";

export type Sonuc = {
  tur: SonucTuru;
  baslik: string;
  altBaslik: string | null;
  href: string;
};

// "Uçuş Kontrolü" ve "ucus kontrolu" eşleşsin: Türkçe küçültme + aksan sadeleştirme.
export function normalize(s: string): string {
  return (s ?? "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .trim();
}

// Çok kısa sorgu her şeyi getirir → arama yapılmaz.
export function gecerliSorgu(q: string | null | undefined): string | null {
  const t = (q ?? "").trim();
  return t.length >= 2 ? t : null;
}

// Tam eşleşme > başlıkta baştan eşleşme > başlıkta geçme > yalnız alt başlıkta geçme.
export function skor(s: Sonuc, q: string): number {
  const b = normalize(s.baslik);
  const alt = normalize(s.altBaslik ?? "");
  const n = normalize(q);
  if (b === n) return 100;
  if (b.startsWith(n)) return 80;
  if (b.includes(n)) return 60;
  if (alt.includes(n)) return 30;
  return 0;
}

// Eşleşmeyenleri atar, skora göre sıralar; eşit skorda başlığa göre kararlı sıralama.
export function sirala(sonuclar: Sonuc[], q: string): Sonuc[] {
  return sonuclar
    .map((s) => ({ s, p: skor(s, q) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.s.baslik.localeCompare(b.s.baslik, "tr"))
    .map((x) => x.s);
}
