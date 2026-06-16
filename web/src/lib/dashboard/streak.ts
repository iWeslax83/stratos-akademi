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

// Peş peşe aktif gün sayısı. En yeni aktif gün bugün veya dün olmalı (1 gün tolerans).
export function computeStreak(activityDates: Date[], today: Date): number {
  if (activityDates.length === 0) return 0;
  const days = new Set(activityDates.map(istanbulDayKey));

  let cursor = new Date(today.getTime());
  if (!days.has(istanbulDayKey(cursor))) {
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
    if (!days.has(istanbulDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(istanbulDayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }
  return streak;
}
