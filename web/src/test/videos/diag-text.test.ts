import { describe, it, expect } from "vitest";
import { elemeMetni, huniMetni, neOldu } from "@/lib/videos/diag-text";
import { bosEleme } from "@/lib/videos/filter";
import type { ScanDiag } from "@/lib/videos/types";

function diag(over: Partial<ScanDiag> = {}): ScanDiag {
  return {
    modul_sayisi: 3, sorgu_sayisi: 3, arama_sonucu: 30, tekil_id: 25, detay_cekilen: 25,
    eleme: bosEleme(), filtreden_gecen: 5, siniflandirilan: 5,
    gemini_uygun: 2, gemini_uygunsuz: 3, gemini_hata: 0,
    kalite_eleme: { dusuk_skor: 0, modul_dolu: 0, ayni_kanal: 0 }, hatalar: [],
    ...over,
  };
}

describe("elemeMetni", () => {
  it("çoktan aza sıralar, sıfırları atar", () => {
    const e = { ...bosEleme(), az_izlenme: 3, eski: 7 };
    expect(elemeMetni(e)).toBe("7 eski, 3 az izlenme");
  });
  it("eleme yoksa boş döner", () => {
    expect(elemeMetni(bosEleme())).toBe("");
  });
});

describe("huniMetni", () => {
  it("tüm aşamaları içerir", () => {
    const s = huniMetni(diag({ eleme: { ...bosEleme(), dil: 20 } }));
    expect(s).toContain("3 sorgu → 25 tekil video");
    expect(s).toContain("20 elendi (20 dil uymuyor)");
    expect(s).toContain("2 uygun");
  });
});

describe("neOldu", () => {
  it("başarılı koşuda sebep yok", () => {
    expect(neOldu(diag())).toBeNull();
  });
  it("API hatasını her şeyin önüne koyar", () => {
    expect(neOldu(diag({ hatalar: ["YouTube search HTTP 403: quotaExceeded"] })))
      .toContain("quotaExceeded");
  });
  it("hepsi filtrede elendiyse eşikleri suçlar", () => {
    const s = neOldu(diag({ filtreden_gecen: 0, siniflandirilan: 0, gemini_uygun: 0, gemini_uygunsuz: 0, eleme: { ...bosEleme(), az_izlenme: 25 } }));
    expect(s).toContain("mekanik filtrede elendi");
    expect(s).toContain("25 az izlenme");
  });
  it("Gemini hiçbirini beğenmediyse bunu söyler", () => {
    expect(neOldu(diag({ gemini_uygun: 0, gemini_uygunsuz: 5 })))
      .toContain("uygun bulmadı");
  });
  it("modül yoksa müfredatı işaret eder", () => {
    expect(neOldu(diag({ modul_sayisi: 0 }))).toContain("modül yok");
  });
});

describe("neOldu — kalite kapısı", () => {
  it("kapı adayların hepsini elediyse sebep gösterir", () => {
    const s = neOldu(diag({
      gemini_uygun: 2,
      kalite_eleme: { dusuk_skor: 2, modul_dolu: 0, ayni_kanal: 0 },
    }));
    expect(s).toContain("kalite kapısı hepsini eledi");
  });

  it("kapı adayların yalnız BİR KISMINI elediyse sebep yok (öneri eklendi)", () => {
    const s = neOldu(diag({
      gemini_uygun: 9,
      kalite_eleme: { dusuk_skor: 0, modul_dolu: 1, ayni_kanal: 0 },
    }));
    expect(s).toBeNull();
  });
});
