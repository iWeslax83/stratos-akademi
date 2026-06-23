import { describe, it, expect } from "vitest";
import { BADGES } from "@/lib/badges/catalog";
import { computeBadges, badgeProgress, nextBadge } from "@/lib/badges/compute";
import type { BadgeStats } from "@/lib/badges/catalog";

const ZERO: BadgeStats = {
  lessons: 0,
  tasks: 0,
  competencies: 0,
  points: 0,
  streak: 0,
  quizPerfect: 0,
};

describe("BADGES katalog", () => {
  it("15 rozet tanımlı, id'ler benzersiz", () => {
    expect(BADGES).toHaveLength(15);
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(15);
  });

  it("her rozet pozitif eşikli ve geçerli dep'li", () => {
    const deps = new Set(["lessons", "tasks", "competencies", "points", "streak", "quizPerfect"]);
    for (const b of BADGES) {
      expect(b.esik).toBeGreaterThan(0);
      expect(deps.has(b.dep)).toBe(true);
      expect(b.ad.length).toBeGreaterThan(0);
      expect(b.ikon.length).toBeGreaterThan(0);
    }
  });

  it("streak ve quizPerfect rozetleri private, diğerleri public", () => {
    for (const b of BADGES) {
      const beklenenPublic = b.dep !== "streak" && b.dep !== "quizPerfect";
      expect(b.public).toBe(beklenenPublic);
    }
    expect(BADGES.filter((b) => b.public)).toHaveLength(10);
    expect(BADGES.filter((b) => !b.public)).toHaveLength(5);
  });
});

describe("computeBadges", () => {
  it("sıfır stat → hiç rozet yok (tüm eşikler > 0)", () => {
    expect(computeBadges(ZERO).size).toBe(0);
  });

  it("1 ders → İlk Adım kazanılır, Meraklı kazanılmaz", () => {
    const earned = computeBadges({ ...ZERO, lessons: 1 });
    expect(earned.has("ilk-ders")).toBe(true);
    expect(earned.has("merakli")).toBe(false);
  });

  it("eşik sınırında kazanılır (5 ders → Meraklı)", () => {
    expect(computeBadges({ ...ZERO, lessons: 4 }).has("merakli")).toBe(false);
    expect(computeBadges({ ...ZERO, lessons: 5 }).has("merakli")).toBe(true);
  });

  it("yüksek stat alt eşikleri de kapsar (30 ders → 4 ders rozeti)", () => {
    const earned = computeBadges({ ...ZERO, lessons: 30 });
    expect(earned.has("ilk-ders")).toBe(true);
    expect(earned.has("merakli")).toBe(true);
    expect(earned.has("azimli")).toBe(true);
    expect(earned.has("maraton")).toBe(true);
  });

  it("her dep bağımsız değerlendirilir", () => {
    const earned = computeBadges({ ...ZERO, tasks: 1, competencies: 3, points: 250, streak: 7, quizPerfect: 1 });
    expect(earned.has("gorev-eri")).toBe(true);
    expect(earned.has("uzman")).toBe(true);
    expect(earned.has("cok-yonlu")).toBe(true);
    expect(earned.has("puan-250")).toBe(true);
    expect(earned.has("seri-3")).toBe(true);
    expect(earned.has("seri-7")).toBe(true);
    expect(earned.has("seri-30")).toBe(false);
    expect(earned.has("tam-isabet")).toBe(true);
  });
});

describe("badgeProgress", () => {
  it("full scope → 15 öğe, earned bayrağı doğru", () => {
    const rows = badgeProgress({ ...ZERO, lessons: 5 }, "full");
    expect(rows).toHaveLength(15);
    const merakli = rows.find((r) => r.badge.id === "merakli")!;
    expect(merakli.earned).toBe(true);
    expect(merakli.current).toBe(5);
    const azimli = rows.find((r) => r.badge.id === "azimli")!;
    expect(azimli.earned).toBe(false);
  });

  it("public scope → yalnız 10 public rozet", () => {
    const rows = badgeProgress(ZERO, "public");
    expect(rows).toHaveLength(10);
    expect(rows.every((r) => r.badge.public)).toBe(true);
    expect(rows.some((r) => r.badge.dep === "streak")).toBe(false);
  });
});

describe("nextBadge", () => {
  it("en küçük kalanlı kilitli rozeti seçer", () => {
    // lessons 3 → İlk Adım(1) kazanıldı; Meraklı(5) kalan 2; Azimli(15) kalan 12...
    const next = nextBadge({ ...ZERO, lessons: 3 }, "full");
    expect(next).not.toBeNull();
    expect(next!.badge.id).toBe("merakli");
    expect(next!.kalan).toBe(2);
  });

  it("sıfır statta oransal eşitlik → en küçük eşikli ilk kilometre taşı (İlk Adım)", () => {
    const next = nextBadge(ZERO, "full");
    expect(next!.badge.id).toBe("ilk-ders");
  });

  it("hepsi kazanıldıysa null", () => {
    const maxed: BadgeStats = {
      lessons: 999,
      tasks: 999,
      competencies: 999,
      points: 9999,
      streak: 999,
      quizPerfect: 999,
    };
    expect(nextBadge(maxed, "full")).toBeNull();
  });

  it("public scope private rozetleri önermez", () => {
    const next = nextBadge({ ...ZERO, lessons: 100, tasks: 100, competencies: 100, points: 9999 }, "public");
    // tüm public rozetler kazanıldı → null (streak/quiz önerilmez)
    expect(next).toBeNull();
  });
});
