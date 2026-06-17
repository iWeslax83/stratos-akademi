import { describe, it, expect } from "vitest";
import { earnedCompetencies } from "@/lib/dashboard/competencies";
import type { TrackProgress } from "@/lib/curriculum/types";

const TP = (slug: string, pct: number, total = 3): TrackProgress => ({
  slug,
  ad: slug,
  ikon: null,
  moduleCount: 1,
  done: Math.round((pct / 100) * total),
  total,
  pct,
});

describe("earnedCompetencies", () => {
  it("pct 100 olan dalların slug'larını döner", () => {
    expect(earnedCompetencies([TP("a", 100), TP("b", 30), TP("c", 100)])).toEqual(["a", "c"]);
  });
  it("hiçbiri 100 değilse boş", () => {
    expect(earnedCompetencies([TP("a", 99), TP("b", 0)])).toEqual([]);
  });
  it("dersi olmayan dal (total 0) yetkinlik sayılmaz", () => {
    expect(earnedCompetencies([TP("bos", 0, 0)])).toEqual([]);
  });
});
