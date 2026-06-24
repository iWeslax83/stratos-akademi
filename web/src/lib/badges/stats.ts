import type { DashboardStats } from "@/lib/dashboard/stats";
import type { BadgeStats } from "./catalog";

/**
 * Dashboard istatistiklerini rozet hesabı için BadgeStats'a dönüştürür.
 * panom + profil aynı eşlemeyi kullanır (tek kaynak → tutarlılık).
 */
export function badgeStatsFromDashboard(
  stats: DashboardStats,
  approvedTaskCount: number | null | undefined,
): BadgeStats {
  return {
    lessons: stats.completedCount,
    tasks: approvedTaskCount ?? 0,
    competencies: stats.earnedCompetencies.length,
    points: stats.points,
    streak: stats.streak,
    quizPerfect: stats.bestQuizScores.filter((s) => s >= 100).length,
  };
}
