export const DERS_PUANI = 20;

export type PointsBreakdown = { ders: number; quiz: number; gorev: number; toplam: number };

// Puanın kaynak dağılımı (tek formül kaynağı): ders × 20 + quiz en iyi yüzdeleri + onaylı görev puanı.
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

// Toplam puan (pointsBreakdown.toplam ile aynı).
export function computePoints(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): number {
  return pointsBreakdown(completedCount, bestQuizScores, approvedTaskPoints).toplam;
}
