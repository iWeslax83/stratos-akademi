import { describe, it, expect } from "vitest";
import { badgeStatsFromDashboard } from "@/lib/badges/stats";
import type { DashboardStats } from "@/lib/dashboard/stats";

const base: DashboardStats = {
  completedCount: 12,
  bestQuizScores: [100, 80, 100, 60],
  streak: 5,
  points: 340,
  perTrack: [],
  overall: { done: 12, total: 20, pct: 60 },
  earnedCompetencies: ["elektronik", "yazilim"],
};

describe("badgeStatsFromDashboard", () => {
  it("dashboard istatistiklerini BadgeStats'a eşler", () => {
    const s = badgeStatsFromDashboard(base, 3);
    expect(s.lessons).toBe(12);
    expect(s.tasks).toBe(3);
    expect(s.competencies).toBe(2);
    expect(s.points).toBe(340);
    expect(s.streak).toBe(5);
    expect(s.quizPerfect).toBe(2); // iki tane 100
  });

  it("onaylı görev sayısı null/undefined → 0", () => {
    expect(badgeStatsFromDashboard(base, null).tasks).toBe(0);
    expect(badgeStatsFromDashboard(base, undefined).tasks).toBe(0);
  });

  it("tam puanlı quiz yoksa quizPerfect 0", () => {
    expect(badgeStatsFromDashboard({ ...base, bestQuizScores: [90, 50] }, 0).quizPerfect).toBe(0);
  });
});
