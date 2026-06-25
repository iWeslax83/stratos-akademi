import { describe, it, expect } from "vitest";
import { announcementExcerpt } from "@/lib/announcements/format";

describe("announcementExcerpt", () => {
  it("max altındaki metni olduğu gibi (kırpılmış) döner", () => {
    expect(announcementExcerpt("  Kısa duyuru  ")).toBe("Kısa duyuru");
    expect(announcementExcerpt(null)).toBe("");
    expect(announcementExcerpt(undefined)).toBe("");
  });

  it("uzun metni max'ta keser ve … ekler", () => {
    const uzun = "a".repeat(200);
    const r = announcementExcerpt(uzun, 50);
    expect(r.endsWith("…")).toBe(true);
    expect(r.length).toBeLessThanOrEqual(51);
  });

  it("kelime ortasında kesmez (son boşluğa kadar geri alır)", () => {
    const metin = "Salı günü saat on sekizde sprint toplantısı atölyede yapılacak arkadaşlar";
    const r = announcementExcerpt(metin, 30);
    // 30. karakter "spri…" ortasına denk gelir; son tam kelimeye geri alınır.
    expect(r).toBe("Salı günü saat on sekizde…");
  });
});
