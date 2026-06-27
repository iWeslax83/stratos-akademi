import { describe, it, expect } from "vitest";
import { sortAttemptsDesc, summarizeAttempts, type AttemptRow } from "@/lib/quiz/history";

const rows: AttemptRow[] = [
  { puan: 60, gecti: false, created_at: "2026-01-01T10:00:00Z" },
  { puan: 90, gecti: true, created_at: "2026-01-03T10:00:00Z" },
  { puan: 75, gecti: true, created_at: "2026-01-02T10:00:00Z" },
];

describe("sortAttemptsDesc", () => {
  it("en yeni deneme başa gelir", () => {
    const r = sortAttemptsDesc(rows);
    expect(r.map((x) => x.created_at)).toEqual([
      "2026-01-03T10:00:00Z",
      "2026-01-02T10:00:00Z",
      "2026-01-01T10:00:00Z",
    ]);
  });

  it("girdiyi mutasyona uğratmaz", () => {
    const copy = [...rows];
    sortAttemptsDesc(rows);
    expect(rows).toEqual(copy);
  });
});

describe("summarizeAttempts", () => {
  it("deneme yoksa null", () => {
    expect(summarizeAttempts([])).toBeNull();
  });

  it("deneme/en iyi/son puan/geçti hesaplar", () => {
    const s = summarizeAttempts(rows)!;
    expect(s.deneme).toBe(3);
    expect(s.enIyi).toBe(90); // en yüksek puan
    expect(s.sonPuan).toBe(90); // 03 Ocak son deneme
    expect(s.gecti).toBe(true); // en az bir geçen var
  });

  it("trend = son puan - bir önceki puan", () => {
    // son (03 Oca) = 90, önceki (02 Oca) = 75 → +15
    expect(summarizeAttempts(rows)!.trend).toBe(15);
  });

  it("tek denemede trend 0", () => {
    const s = summarizeAttempts([{ puan: 50, gecti: false, created_at: "2026-01-01T10:00:00Z" }])!;
    expect(s.trend).toBe(0);
    expect(s.deneme).toBe(1);
    expect(s.enIyi).toBe(50);
    expect(s.sonPuan).toBe(50);
    expect(s.gecti).toBe(false);
  });

  it("en iyi puan son denemeden farklı olabilir (gerileme)", () => {
    const r: AttemptRow[] = [
      { puan: 95, gecti: true, created_at: "2026-01-01T10:00:00Z" },
      { puan: 70, gecti: true, created_at: "2026-01-05T10:00:00Z" },
    ];
    const s = summarizeAttempts(r)!;
    expect(s.enIyi).toBe(95);
    expect(s.sonPuan).toBe(70);
    expect(s.trend).toBe(-25);
  });
});
