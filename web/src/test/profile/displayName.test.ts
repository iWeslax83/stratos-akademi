import { describe, it, expect } from "vitest";
import { cleanDisplayName } from "@/lib/profile/displayName";

describe("cleanDisplayName", () => {
  it("baştaki/sondaki boşlukları kırpar", () => {
    const r = cleanDisplayName("  Emir Sakarya  ");
    expect(r.ok && r.value).toBe("Emir Sakarya");
  });

  it("iç içe çoklu boşlukları teke indirir", () => {
    const r = cleanDisplayName("Emir   Sakarya");
    expect(r.ok && r.value).toBe("Emir Sakarya");
  });

  it("boş / yalnız boşluk → hata", () => {
    expect(cleanDisplayName("").ok).toBe(false);
    expect(cleanDisplayName("   ").ok).toBe(false);
  });

  it("tek karakter → hata (en az 2)", () => {
    expect(cleanDisplayName("A").ok).toBe(false);
  });

  it("60 karakterden uzun → hata", () => {
    expect(cleanDisplayName("a".repeat(61)).ok).toBe(false);
    expect(cleanDisplayName("a".repeat(60)).ok).toBe(true);
  });

  it("Türkçe karakterleri korur, unicode uzunluğu sayar", () => {
    const r = cleanDisplayName("Şükrü Çağlayan");
    expect(r.ok && r.value).toBe("Şükrü Çağlayan");
  });
});
