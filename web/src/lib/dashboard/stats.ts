import type { Curriculum, TrackProgress } from "@/lib/curriculum/types";
import { overallProgress, trackProgress } from "@/lib/curriculum/progress";
import { computePoints } from "./points";
import { computeStreak } from "./streak";
import { earnedCompetencies } from "./competencies";

export type DashboardStats = {
  completedCount: number;
  bestQuizScores: number[];
  streak: number;
  points: number;
  perTrack: TrackProgress[];
  overall: { done: number; total: number; pct: number };
  earnedCompetencies: string[];
};

export function buildStats(input: {
  curriculum: Curriculum;
  completedIds: Set<string>;
  bestQuizScores: number[];
  activityDates: Date[];
  today: Date;
  approvedTaskPoints: number;
}): DashboardStats {
  const perTrack = trackProgress(input.curriculum, input.completedIds);
  const overall = overallProgress(input.curriculum, input.completedIds);
  return {
    completedCount: overall.done,
    bestQuizScores: input.bestQuizScores,
    streak: computeStreak(input.activityDates, input.today),
    points: computePoints(overall.done, input.bestQuizScores, input.approvedTaskPoints),
    perTrack,
    overall,
    earnedCompetencies: earnedCompetencies(perTrack),
  };
}
