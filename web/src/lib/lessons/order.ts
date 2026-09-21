export type SiraSatiri = { id: string; sira: number };

// Komşuyla yer değiştirir ve modülü 0..n-1 olarak yeniden numaralar; yalnız sırası
// değişen satırları döner. Çakışan ya da boşluklu mevcut sıralar bu sırada düzelir.
export function moveOrder(rows: SiraSatiri[], id: string, yon: "yukari" | "asagi"): SiraSatiri[] {
  const sirali = [...rows].sort((a, b) => a.sira - b.sira || a.id.localeCompare(b.id));
  const i = sirali.findIndex((r) => r.id === id);
  if (i < 0) return [];
  const j = yon === "yukari" ? i - 1 : i + 1;
  if (j < 0 || j >= sirali.length) return [];
  [sirali[i], sirali[j]] = [sirali[j], sirali[i]];
  const eskiSira = new Map(rows.map((r) => [r.id, r.sira]));
  const degisen: SiraSatiri[] = [];
  sirali.forEach((r, n) => {
    if (eskiSira.get(r.id) !== n) degisen.push({ id: r.id, sira: n });
  });
  return degisen;
}
