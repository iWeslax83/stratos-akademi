import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/admin/slug";

describe("slugify", () => {
  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugify("Çağdaş Yazılım")).toBe("cagdas-yazilim");
    expect(slugify("İHA Pilotluğu")).toBe("iha-pilotlugu");
    expect(slugify("Öğrenci Görüşü")).toBe("ogrenci-gorusu");
  });
  it("boşluk ve özel karakter → tek tire", () => {
    expect(slugify("Ortak   Temel!!!")).toBe("ortak-temel");
    expect(slugify("a / b & c")).toBe("a-b-c");
  });
  it("baş/son tireyi kırpar, küçük harfe çevirir", () => {
    expect(slugify("  Elektronik  ")).toBe("elektronik");
  });
  it("boş girdi boş döner", () => {
    expect(slugify("")).toBe("");
  });
});
