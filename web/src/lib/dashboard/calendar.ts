// Aktivite takvimi: son N hafta için gün-gün aktivite ızgarası (GitHub katkı grafiği tarzı).
// Mevcut activityDates'ten türetilir (ders tamamlama + quiz denemesi) — migration yok.

const TZ = "Europe/Istanbul";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Bir Date'i Türkiye saat diliminde "YYYY-MM-DD" gün anahtarına çevirir.
// (Türkiye 2016'dan beri sabit UTC+3; yaz saati yok → 24sa çıkarmak güvenli.)
export function istanbulDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export type DayCell = {
  key: string; // Istanbul "YYYY-MM-DD"
  count: number; // o gün kaç aktivite
  future: boolean; // bugünden sonra (boş hücre)
};

export type ActivityCalendar = {
  weeks: DayCell[][]; // sütun = hafta (eskiden yeniye), satır = Pzt..Paz
  aktifGun: number; // ızgara içinde en az 1 aktivite olan gün sayısı
  toplam: number; // ızgara içindeki toplam aktivite
};

// Aktivite yoğunluğunu 0..3 seviyesine eşler (renk tonu için).
export function activityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

// today dahil son `weeks` haftayı Pazartesi hizalı ızgara olarak kurar.
export function buildActivityCalendar(
  activityDates: Date[],
  today: Date,
  weeks = 12,
): ActivityCalendar {
  // Gün başına aktivite sayısı.
  const counts = new Map<string, number>();
  for (const d of activityDates) {
    const k = istanbulDayKey(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const todayKey = istanbulDayKey(today);
  // Noon-UTC çapası: gün eklerken/çıkarırken Istanbul gününü kaydırmaz (UTC+3 sabit).
  const base = new Date(`${todayKey}T12:00:00Z`);
  const wToday = (base.getUTCDay() + 6) % 7; // Pzt=0 .. Paz=6
  const startMs = base.getTime() - (wToday + (weeks - 1) * 7) * ONE_DAY_MS;

  const grid: DayCell[][] = [];
  let aktifGun = 0;
  let toplam = 0;

  for (let col = 0; col < weeks; col++) {
    const week: DayCell[] = [];
    for (let row = 0; row < 7; row++) {
      const ms = startMs + (col * 7 + row) * ONE_DAY_MS;
      const key = istanbulDayKey(new Date(ms));
      const future = key > todayKey;
      const count = future ? 0 : counts.get(key) ?? 0;
      if (count > 0) {
        aktifGun++;
        toplam += count;
      }
      week.push({ key, count, future });
    }
    grid.push(week);
  }

  return { weeks: grid, aktifGun, toplam };
}
