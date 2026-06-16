import { describe, it, expect } from "vitest";
import { buildStats } from "@/lib/dashboard/stats";
import type { Curriculum } from "@/lib/curriculum/types";

const L = (id: string, sira: number) => ({
  id,
  baslik: id,
  youtube_video_id: "v" + id,
  aciklama: null,
  sure_sn: 60,
  sira,
});

const curriculum: Curriculum = [
  {
    id: "t1",
    slug: "ortak-temel",
    ad: "Ortak Temel",
    aciklama: null,
    ikon: "🚀",
    sira: 1,
    modules: [{ id: "m1", ad: "M1", aciklama: null, sira: 1, quiz: null, lessons: [L("a", 1), L("b", 2)] }],
  },
  {
    id: "t2",
    slug: "elektronik",
    ad: "Elektronik",
    aciklama: null,
    ikon: "⚡",
    sira: 2,
    modules: [{ id: "m2", ad: "M2", aciklama: null, sira: 1, quiz: null, lessons: [L("c", 1)] }],
  },
];

describe("buildStats", () => {
  it("tüm istatistikleri tek nesnede birleştirir", () => {
    const stats = buildStats({
      curriculum,
      completedIds: new Set(["a", "b"]), // ortak-temel %100
      bestQuizScores: [90, 75],
      activityDates: [new Date("2026-06-17T08:00:00+03:00")],
      today: new Date("2026-06-17T09:00:00+03:00"),
    });
    expect(stats.completedCount).toBe(2);
    expect(stats.points).toBe(205); // 2*20 + 90 + 75
    expect(stats.streak).toBe(1);
    expect(stats.overall).toEqual({ done: 2, total: 3, pct: 67 });
    expect(stats.earnedCompetencies).toEqual(["ortak-temel"]);
    expect(stats.perTrack.map((t) => t.slug)).toEqual(["ortak-temel", "elektronik"]);
  });
});
