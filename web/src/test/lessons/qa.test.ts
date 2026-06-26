import { describe, it, expect } from "vitest";
import { buildLessonThread, canDeleteQa, type QaRow } from "@/lib/lessons/qa";

const rows: QaRow[] = [
  { id: "q2", lesson_id: "l1", author_id: "kaptan", mesaj: "cevap", created_at: "2026-06-26T10:00:00Z" },
  { id: "q1", lesson_id: "l1", author_id: "uye", mesaj: "soru", created_at: "2026-06-26T09:00:00Z" },
];
const nameById = new Map([
  ["uye", "Ali"],
  ["kaptan", "Kaptan Emir"],
]);
const adminIds = new Set(["kaptan"]);

describe("buildLessonThread", () => {
  it("created_at artan sıralar", () => {
    expect(buildLessonThread(rows, nameById, adminIds).map((i) => i.id)).toEqual(["q1", "q2"]);
  });

  it("ad + admin etiketi doğru", () => {
    const [soru, cevap] = buildLessonThread(rows, nameById, adminIds);
    expect(soru).toMatchObject({ authorAd: "Ali", authorIsAdmin: false });
    expect(cevap).toMatchObject({ authorAd: "Kaptan Emir", authorIsAdmin: true });
  });

  it("bilinmeyen ad → 'Üye'", () => {
    const r = buildLessonThread(
      [{ id: "x", lesson_id: "l1", author_id: "yok", mesaj: "m", created_at: "2026-06-26T11:00:00Z" }],
      new Map(),
      new Set(),
    );
    expect(r[0].authorAd).toBe("Üye");
  });
});

describe("canDeleteQa", () => {
  it("yazan silebilir", () => {
    expect(canDeleteQa({ authorId: "uye" }, "uye", false)).toBe(true);
  });
  it("admin başkasınınkini silebilir", () => {
    expect(canDeleteQa({ authorId: "uye" }, "kaptan", true)).toBe(true);
  });
  it("başkası silemez", () => {
    expect(canDeleteQa({ authorId: "uye" }, "baska", false)).toBe(false);
  });
});
