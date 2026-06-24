export const DERS_PUANI = 20;

// Puan = tamamlanan ders × 20 + quiz en iyi yüzdeleri + onaylı görev puanı.
export function computePoints(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): number {
  return completedCount * DERS_PUANI + bestQuizScores.reduce((sum, s) => sum + s, 0) + approvedTaskPoints;
}

export type PointsBreakdown = { ders: number; quiz: number; gorev: number; toplam: number };

// Puanın kaynak dağılımı (profil şeffaflığı için). toplam = computePoints ile aynı.
export function pointsBreakdown(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): PointsBreakdown {
  const ders = completedCount * DERS_PUANI;
  const quiz = bestQuizScores.reduce((sum, s) => sum + s, 0);
  const gorev = approvedTaskPoints;
  return { ders, quiz, gorev, toplam: ders + quiz + gorev };
}
