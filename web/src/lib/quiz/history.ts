// Quiz deneme geçmişi: mevcut quiz_attempts satırlarından türetilir (migration yok).
// Saf mantık — UI ve sorgu bunları kullanır.

export type AttemptRow = {
  puan: number;
  gecti: boolean;
  created_at: string;
};

export type AttemptSummary = {
  deneme: number; // toplam deneme sayısı
  enIyi: number; // en yüksek puan
  sonPuan: number; // en son denemenin puanı
  gecti: boolean; // herhangi bir denemede geçtiyse true
  trend: number; // son puan - bir önceki puan (tek deneme → 0)
};

// Denemeleri en yeniden eskiye sıralar (created_at azalan). Girdiyi mutasyona uğratmaz.
export function sortAttemptsDesc(rows: AttemptRow[]): AttemptRow[] {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Özet istatistikler. Deneme yoksa null.
export function summarizeAttempts(rows: AttemptRow[]): AttemptSummary | null {
  if (rows.length === 0) return null;
  const desc = sortAttemptsDesc(rows);
  const enIyi = Math.max(...rows.map((r) => r.puan));
  const sonPuan = desc[0].puan;
  const oncekiPuan = desc.length > 1 ? desc[1].puan : sonPuan;
  return {
    deneme: rows.length,
    enIyi,
    sonPuan,
    gecti: rows.some((r) => r.gecti),
    trend: sonPuan - oncekiPuan,
  };
}
