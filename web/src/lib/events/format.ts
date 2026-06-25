// Etkinlik için saf yardımcılar. DB I/O yok; test edilebilir.

export type EventLite = {
  id: string;
  baslik: string;
  aciklama: string | null;
  baslangic: string;
  yer: string | null;
};

// Etkinlikleri yaklaşan (baslangic >= now, artan) ve geçmiş (baslangic < now, azalan) olarak ayırır.
export function partitionEvents<T extends { baslangic: string }>(
  events: T[],
  nowMs: number,
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const e of events) {
    const t = new Date(e.baslangic).getTime();
    if (Number.isFinite(t) && t >= nowMs) upcoming.push(e);
    else past.push(e);
  }
  upcoming.sort((a, b) => (a.baslangic < b.baslangic ? -1 : a.baslangic > b.baslangic ? 1 : 0));
  past.sort((a, b) => (a.baslangic > b.baslangic ? -1 : a.baslangic < b.baslangic ? 1 : 0));
  return { upcoming, past };
}
