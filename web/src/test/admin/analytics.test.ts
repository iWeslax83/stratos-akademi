import { describe, it, expect } from "vitest";
import { bestPerUser, quizStat, gunOnce, sonAktivite } from "@/lib/admin/analytics";

describe("bestPerUser", () => {
  it("kullanıcı başına en yüksek puan", () => {
    const m = bestPerUser([
      { user_id: "u1", puan: 80 },
      { user_id: "u1", puan: 90 },
      { user_id: "u2", puan: 50 },
    ]);
    expect(m.get("u1")).toBe(90);
    expect(m.get("u2")).toBe(50);
  });
});

describe("quizStat", () => {
  it("deneyen/ortBest/gecen", () => {
    const r = quizStat(
      [
        { user_id: "u1", puan: 80 },
        { user_id: "u1", puan: 90 },
        { user_id: "u2", puan: 50 },
      ],
      70,
    );
    expect(r).toEqual({ deneyen: 2, ortBest: 70, gecen: 1 }); // best u1=90,u2=50 → ort 70, geçen 1
  });
  it("deneme yoksa sıfır", () => {
    expect(quizStat([], 70)).toEqual({ deneyen: 0, ortBest: 0, gecen: 0 });
  });
});

describe("gunOnce", () => {
  const now = Date.UTC(2026, 5, 18, 12, 0, 0);
  it("null → null", () => {
    expect(gunOnce(null, now)).toBeNull();
  });
  it("bugün → 0", () => {
    expect(gunOnce(new Date(now).toISOString(), now)).toBe(0);
  });
  it("7 gün önce → 7", () => {
    expect(gunOnce(new Date(now - 7 * 86400000).toISOString(), now)).toBe(7);
  });
});

describe("sonAktivite", () => {
  it("en yeni tarihi döner, null'ları atlar", () => {
    expect(sonAktivite([null, "2026-06-10T00:00:00Z", "2026-06-15T00:00:00Z"])).toBe(
      "2026-06-15T00:00:00Z",
    );
  });
  it("hepsi null → null", () => {
    expect(sonAktivite([null, null])).toBeNull();
  });
});
