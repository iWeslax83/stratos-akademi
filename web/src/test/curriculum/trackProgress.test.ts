import { describe, it, expect } from "vitest";
import { trackProgress, moduleProgress } from "@/lib/curriculum/progress";
import type { Curriculum, Module } from "@/lib/curriculum/types";

const L = (id: string, sira: number, sure: number | null = null) => ({
  id,
  baslik: id,
  youtube_video_id: "v" + id,
  aciklama: null,
  sure_sn: sure,
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
    modules: [
      { id: "m1", ad: "M1", aciklama: null, sira: 1, quiz: null, lessons: [L("a", 1), L("b", 2)] },
      { id: "m2", ad: "M2", aciklama: null, sira: 2, quiz: null, lessons: [L("c", 1)] },
    ],
  },
  {
    id: "t2",
    slug: "elektronik",
    ad: "Elektronik",
    aciklama: null,
    ikon: "⚡",
    sira: 2,
    modules: [{ id: "m3", ad: "M3", aciklama: null, sira: 1, quiz: null, lessons: [L("d", 1)] }],
  },
];

describe("trackProgress", () => {
  it("dal başına done/total/pct ve modül sayısı", () => {
    const r = trackProgress(curriculum, new Set(["a", "b"]));
    expect(r).toEqual([
      { slug: "ortak-temel", ad: "Ortak Temel", ikon: "🚀", moduleCount: 2, done: 2, total: 3, pct: 67 },
      { slug: "elektronik", ad: "Elektronik", ikon: "⚡", moduleCount: 1, done: 0, total: 1, pct: 0 },
    ]);
  });
  it("dersi olmayan dal pct 0", () => {
    const empty: Curriculum = [
      { id: "t", slug: "s", ad: "Boş", aciklama: null, ikon: null, sira: 1, modules: [] },
    ];
    expect(trackProgress(empty, new Set())[0].pct).toBe(0);
  });
});

describe("moduleProgress", () => {
  const mod: Module = {
    id: "m",
    ad: "M",
    aciklama: null,
    sira: 1,
    quiz: null,
    lessons: [L("x", 1, 100), L("y", 2, 120)],
  };
  it("tamamlanan oranı ve kalan süreyi (tamamlanmamış derslerin sure_sn toplamı) verir", () => {
    expect(moduleProgress(mod, new Set(["x"]))).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      kalanSure_sn: 120,
    });
  });
  it("hepsi tamamsa kalan 0", () => {
    expect(moduleProgress(mod, new Set(["x", "y"]))).toEqual({
      done: 2,
      total: 2,
      pct: 100,
      kalanSure_sn: 0,
    });
  });
});
