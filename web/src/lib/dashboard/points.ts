// Puan = tamamlanan ders × 20 + quiz en iyi yüzdeleri + onaylı görev puanı.
export function computePoints(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): number {
  return completedCount * 20 + bestQuizScores.reduce((sum, s) => sum + s, 0) + approvedTaskPoints;
}
