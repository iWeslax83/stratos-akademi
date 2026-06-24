// Dashboard ham verisinden saf türetmeler (getDashboardData'dan ayrıştırıldı → test edilebilir).

// Quiz başına en iyi puanların listesi.
export function bestScoresPerQuiz(attempts: { quiz_id: string; puan: number }[]): number[] {
  const best = new Map<string, number>();
  for (const a of attempts) best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? 0, a.puan));
  return [...best.values()];
}

// Supabase join (`practical_tasks(puan)`) bazen nesne, bazen tek-elemanlı dizi döner;
// her iki şekli de güvenle ele alıp onaylı görev puanlarını toplar.
export type ApprovedTaskRow = {
  practical_tasks: { puan: number } | { puan: number }[] | null;
};

export function sumApprovedTaskPoints(rows: ApprovedTaskRow[]): number {
  let total = 0;
  for (const r of rows) {
    const pt = Array.isArray(r.practical_tasks) ? r.practical_tasks[0]?.puan : r.practical_tasks?.puan;
    total += pt ?? 0;
  }
  return total;
}
