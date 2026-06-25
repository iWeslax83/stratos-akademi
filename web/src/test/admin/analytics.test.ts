import { describe, it, expect } from "vitest";
import {
  bestPerUser,
  quizStat,
  gunOnce,
  sonAktivite,
  riskliUyeler,
  trackCompletionPct,
} from "@/lib/admin/analytics";

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

describe("riskliUyeler", () => {
  const uyeler = [
    { ad: "Aktif", gun: 2 },
    { ad: "Sınırda", gun: 14 },
    { ad: "Pasif", gun: 20 },
    { ad: "Hiç", gun: null },
  ];
  it("eşikten uzun pasif + hiç aktif olmayanı seçer; eşik dahil değil", () => {
    const r = riskliUyeler(uyeler, 14).map((u) => u.ad);
    expect(r).toEqual(["Pasif", "Hiç"]);
  });
  it("kimse riskli değilse boş", () => {
    expect(riskliUyeler([{ gun: 1 }, { gun: 0 }], 14)).toEqual([]);
  });
});

describe("trackCompletionPct", () => {
  it("tamamlanan / (ders × üye)", () => {
    expect(trackCompletionPct(10, 4, 20)).toBe(50); // 20/40
  });
  it("tam tamamlama → 100", () => {
    expect(trackCompletionPct(5, 3, 15)).toBe(100);
  });
  it("yuvarlar", () => {
    expect(trackCompletionPct(3, 1, 1)).toBe(33); // 1/3
  });
  it("ders ya da üye yoksa 0 (sıfıra bölme yok)", () => {
    expect(trackCompletionPct(0, 5, 0)).toBe(0);
    expect(trackCompletionPct(5, 0, 0)).toBe(0);
  });
});
