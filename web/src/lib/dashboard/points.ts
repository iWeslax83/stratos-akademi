// Puan = tamamlanan ders sayısı × 20 + her quizin en iyi yüzde puanının toplamı.
export function computePoints(completedCount: number, bestQuizScores: number[]): number {
  return completedCount * 20 + bestQuizScores.reduce((sum, s) => sum + s, 0);
}
