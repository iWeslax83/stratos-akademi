import { describe, it, expect } from "vitest";
import { normalize, gecerliSorgu, skor, sirala, type Sonuc } from "@/lib/search/rank";

function s(baslik: string, altBaslik: string | null = null): Sonuc {
  return { tur: "ders", baslik, altBaslik, href: "/x" };
}

describe("normalize", () => {
  it("Türkçe büyük İ/I'yı doğru küçültür", () => {
    expect(normalize("İHA")).toBe("iha");
    expect(normalize("IŞIK")).toBe("isik");
  });
  it("aksanları sadeleştirir", () => {
    expect(normalize("Uçuş Kontrolü")).toBe("ucus kontrolu");
  });
});

describe("gecerliSorgu", () => {
  it("tek harf ya da boşluk arama başlatmaz", () => {
    expect(gecerliSorgu("a")).toBeNull();
    expect(gecerliSorgu("   ")).toBeNull();
    expect(gecerliSorgu(null)).toBeNull();
  });
  it("iki harften itibaren geçerli, kırpar", () => {
    expect(gecerliSorgu("  pid ")).toBe("pid");
  });
});

describe("skor", () => {
  it("tam eşleşme en yüksek", () => {
    expect(skor(s("Lehimleme"), "lehimleme")).toBe(100);
  });
  it("baştan eşleşme, içinde geçmeden yüksek", () => {
    expect(skor(s("PID Ayarı"), "pid")).toBeGreaterThan(skor(s("Quadcopter PID"), "pid"));
  });
  it("yalnız alt başlıkta geçmek en düşük", () => {
    expect(skor(s("Ders", "İHA · Temeller"), "iha")).toBe(30);
  });
  it("eşleşme yoksa sıfır", () => {
    expect(skor(s("Lehimleme"), "python")).toBe(0);
  });
  it("aksansız yazılan sorgu aksanlı başlığı bulur", () => {
    expect(skor(s("Uçuş Kontrolü"), "ucus")).toBe(80);
  });
});

describe("sirala", () => {
  it("eşleşmeyeni atar ve skora göre sıralar", () => {
    const r = sirala([s("Quadcopter PID"), s("Python"), s("PID Ayarı")], "pid");
    expect(r.map((x) => x.baslik)).toEqual(["PID Ayarı", "Quadcopter PID"]);
  });
});
