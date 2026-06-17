import type { TrackProgress } from "@/lib/curriculum/types";

// Yetkinlik = bir dalın %100 tamamlanması. Dersi olmayan dal sayılmaz.
export function earnedCompetencies(perTrack: TrackProgress[]): string[] {
  return perTrack.filter((t) => t.total > 0 && t.pct === 100).map((t) => t.slug);
}
