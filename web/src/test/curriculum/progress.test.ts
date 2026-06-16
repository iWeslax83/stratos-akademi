import { describe, it, expect } from "vitest";
import {
  isComplete,
  flatten,
  computeStatuses,
  resumeLessonId,
  overallProgress,
  findNext,
} from "@/lib/curriculum/progress";
import type { Curriculum } from "@/lib/curriculum/types";

const L = (id: string, sira: number) => ({
  id,
  baslik: id,
  youtube_video_id: "vid" + id,
  aciklama: null,
  sure_sn: null,
  sira,
});

const curriculum: Curriculum = [
  {
    id: "t1",
    slug: "t1",
    ad: "Track 1",
    aciklama: null,
    ikon: null,
    sira: 1,
    modules: [
      { id: "m1", ad: "M1", aciklama: null, sira: 1, lessons: [L("a", 1), L("b", 2)] },
      { id: "m2", ad: "M2", aciklama: null, sira: 2, lessons: [L("c", 1)] },
    ],
  },
];

describe("isComplete", () => {
  it("%90 ve üzeri için true", () => {
    expect(isComplete(90, 100)).toBe(true);
    expect(isComplete(95, 100)).toBe(true);
  });
  it("%90 altı için false", () => {
    expect(isComplete(89, 100)).toBe(false);
  });
  it("süre 0/negatifse false (sıfıra bölme koruması)", () => {
    expect(isComplete(10, 0)).toBe(false);
    expect(isComplete(10, -5)).toBe(false);
  });
});

describe("flatten", () => {
  it("dersleri dal>modül>ders sırasına göre düzleştirir", () => {
    expect(flatten(curriculum).map((f) => f.lesson.id)).toEqual(["a", "b", "c"]);
  });
});

describe("computeStatuses", () => {
  it("tamamlananlar done, ilk tamamlanmamış current, gerisi todo", () => {
    const s = computeStatuses(curriculum, new Set(["a"]));
    expect(s.get("a")).toBe("done");
    expect(s.get("b")).toBe("current");
    expect(s.get("c")).toBe("todo");
  });
});

describe("resumeLessonId", () => {
  it("ilk tamamlanmamış dersi verir", () => {
    expect(resumeLessonId(curriculum, new Set(["a"]))).toBe("b");
  });
  it("hepsi tamamsa null", () => {
    expect(resumeLessonId(curriculum, new Set(["a", "b", "c"]))).toBeNull();
  });
});

describe("overallProgress", () => {
  it("tamamlanan/toplam ve yüzde", () => {
    expect(overallProgress(curriculum, new Set(["a", "b"]))).toEqual({ done: 2, total: 3, pct: 67 });
  });
});

describe("findNext", () => {
  it("verilen dersten sonraki düz sıradaki dersi verir", () => {
    expect(findNext(curriculum, "a")?.lesson.id).toBe("b");
    expect(findNext(curriculum, "c")).toBeNull();
  });
});
