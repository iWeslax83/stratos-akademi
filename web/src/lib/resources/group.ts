// Kaynak kütüphanesi için saf yardımcılar. DB I/O yok; test edilebilir.

export type ResourceLite = {
  id: string;
  baslik: string;
  url: string;
  kategori: string;
  aciklama: string | null;
};

// Form/gruplama için sabit kategori listesi (gruplama sırasını da belirler).
export const KATEGORILER = ["Datasheet", "CAD/Tasarım", "BOM/Malzeme", "Yazılım", "Genel"] as const;

// Geçerli http(s) URL mi? (Başka protokoller — ftp, javascript: vb. — reddedilir.)
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Kaynakları kategoriye göre gruplar; kategori sırası `order` listesine göre,
// listede olmayanlar sona (Türkçe alfabetik). Grup içi sıra girdiyle aynı kalır.
export function groupByCategory<T extends { kategori: string }>(
  items: T[],
  order: readonly string[],
): { kategori: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const arr = map.get(it.kategori) ?? [];
    arr.push(it);
    map.set(it.kategori, arr);
  }
  const rank = (k: string) => {
    const i = order.indexOf(k);
    return i === -1 ? order.length : i;
  };
  return [...map.keys()]
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "tr"))
    .map((kategori) => ({ kategori, items: map.get(kategori)! }));
}
