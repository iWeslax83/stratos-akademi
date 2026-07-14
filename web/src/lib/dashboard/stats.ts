import type { Curriculum, TrackProgress } from "@/lib/curriculum/types";
import { overallProgress, trackProgress } from "@/lib/curriculum/progress";
import { computePoints } from "./points";
import { earnedCompetencies } from "./competencies";

export type DashboardStats = {
  completedCount: number;
  bestQuizScores: number[];
  points: number;
  perTrack: TrackProgress[];
  overall: { done: number; total: number; pct: number };
  earnedCompetencies: string[];
};

export function buildStats(input: {
  curriculum: Curriculum;
  completedIds: Set<string>;
  bestQuizScores: number[];
  approvedTaskPoints: number;
}): DashboardStats {
  const perTrack = trackProgress(input.curriculum, input.completedIds);
  const overall = overallProgress(input.curriculum, input.completedIds);
  return {
    completedCount: overall.done,
    bestQuizScores: input.bestQuizScores,
    points: computePoints(overall.done, input.bestQuizScores, input.approvedTaskPoints),
    perTrack,
    overall,
    earnedCompetencies: earnedCompetencies(perTrack),
  };
}
