// İçerik analitiği saf yardımcıları (≤20 kullanıcı; her şey anlık hesaplanır).

// Kullanıcı başına en iyi quiz puanı.
export function bestPerUser(attempts: { user_id: string; puan: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) m.set(a.user_id, Math.max(m.get(a.user_id) ?? 0, a.puan));
  return m;
}

// Bir quizin istatistiği: kaç üye denedi, ortalama en iyi puan, kaç üye geçti.
export function quizStat(
  attempts: { user_id: string; puan: number }[],
  gecmeEsigi: number,
): { deneyen: number; ortBest: number; gecen: number } {
  const best = [...bestPerUser(attempts).values()];
  const deneyen = best.length;
  const ortBest = deneyen ? Math.round(best.reduce((a, b) => a + b, 0) / deneyen) : 0;
  const gecen = best.filter((v) => v >= gecmeEsigi).length;
  return { deneyen, ortBest, gecen };
}

// ISO tarihten bu yana geçen tam gün sayısı (null → null).
export function gunOnce(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((nowMs - t) / 86_400_000);
}

// Tarih listesinin en yenisi (ISO) — yoksa null.
export function sonAktivite(dates: (string | null)[]): string | null {
  let en: number | null = null;
  let enIso: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (Number.isFinite(t) && (en === null || t > en)) {
      en = t;
      enIso = d;
    }
  }
  return enIso;
}
