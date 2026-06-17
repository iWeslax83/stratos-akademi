import { describe, it, expect } from "vitest";
import { computeStreak } from "@/lib/dashboard/streak";

const today = new Date("2026-06-17T09:00:00+03:00");
const d = (s: string) => new Date(s);

describe("computeStreak", () => {
  it("aktivite yoksa 0", () => {
    expect(computeStreak([], today)).toBe(0);
  });
  it("sadece bugün → 1", () => {
    expect(computeStreak([d("2026-06-17T08:00:00+03:00")], today)).toBe(1);
  });
  it("bugün + dün + evvelsi gün → 3", () => {
    expect(
      computeStreak(
        [
          d("2026-06-17T08:00:00+03:00"),
          d("2026-06-16T20:00:00+03:00"),
          d("2026-06-15T10:00:00+03:00"),
        ],
        today,
      ),
    ).toBe(3);
  });
  it("bugün boş ama dün+evvelsi var → korunur (1 gün tolerans) → 2", () => {
    expect(
      computeStreak(
        [d("2026-06-16T20:00:00+03:00"), d("2026-06-15T10:00:00+03:00")],
        today,
      ),
    ).toBe(2);
  });
  it("sadece 2 gün önce (boşluk) → 0", () => {
    expect(computeStreak([d("2026-06-15T10:00:00+03:00")], today)).toBe(0);
  });
  it("aynı gün birden çok aktivite tek gün sayılır → 1", () => {
    expect(
      computeStreak(
        [d("2026-06-17T08:00:00+03:00"), d("2026-06-17T20:00:00+03:00")],
        today,
      ),
    ).toBe(1);
  });
  it("UTC zaman damgası Türkiye gününe yuvarlanır (gece yarısı sınırı)", () => {
    // 2026-06-16T22:30Z = 2026-06-17T01:30 +03 → İstanbul günü 06-17 (bugün)
    expect(computeStreak([d("2026-06-16T22:30:00Z")], today)).toBe(1);
  });
});
