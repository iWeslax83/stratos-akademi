import { describe, it, expect } from "vitest";
import { kaliteKapisi, siralamaSkoru } from "@/lib/videos/kalite";
import type { PendingRow } from "@/lib/videos/types";

const NOW = new Date("2026-01-01T00:00:00Z");
const SIRALAMA = { now: NOW, maxAgeYears: 4 };

// siralama_skoru üretimde satır kurulurken hesaplanır; testte de aynı yoldan üretiyoruz ki
// kaliteKapisi'nın sıraladığı değer gerçekte yazılan değerle aynı olsun.
function row(over: Partial<PendingRow> = {}): PendingRow {
  const temel = {
    youtube_video_id: "v1", baslik: "Ders", aciklama: null, kanal: "K",
    sure_sn: 600, izlenme: 20000, yayin_tarihi: "2025-01-01T00:00:00Z",
    onerilen_module_id: "m1", uygunluk_skoru: 90, gerekce: "", durum: "pending" as const,
    ...over,
  };
  return { ...temel, siralama_skoru: over.siralama_skoru ?? siralamaSkoru(temel, SIRALAMA) };
}

describe("kaliteKapisi", () => {
  it("eşik altı skorları eler", () => {
    const rows = [row({ youtube_video_id: "a", uygunluk_skoru: 90 }), row({ youtube_video_id: "b", uygunluk_skoru: 65 })];
    const { gecen, elenen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 5, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["a"]);
    expect(elenen.dusuk_skor).toBe(1);
  });

  it("izlenmesi ve tazeliği eşitken yüksek uygunluk skorlusu önce gelir", () => {
    const rows = [
      row({ youtube_video_id: "a", kanal: "A", uygunluk_skoru: 80 }),
      row({ youtube_video_id: "b", kanal: "B", uygunluk_skoru: 95 }),
      row({ youtube_video_id: "c", kanal: "C", uygunluk_skoru: 90 }),
    ];
    const { gecen, elenen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 2, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["b", "c"]);
    expect(elenen.modul_dolu).toBe(1);
  });

  it("kuyrukta zaten bekleyen öneriler sınıra sayılır", () => {
    const rows = [row({ youtube_video_id: "a", kanal: "A" }), row({ youtube_video_id: "b", kanal: "B" })];
    const { gecen, elenen } = kaliteKapisi(rows, {
      minSkor: 70, modulBasinaMax: 3, mevcutModulSayilari: { m1: 2 },
    });
    expect(gecen).toHaveLength(1);
    expect(elenen.modul_dolu).toBe(1);
  });

  it("aynı kanaldan bir modüle birden fazla video önermez", () => {
    const rows = [
      row({ youtube_video_id: "a", kanal: "Kanal X", uygunluk_skoru: 95 }),
      row({ youtube_video_id: "b", kanal: "Kanal X", uygunluk_skoru: 90 }),
      row({ youtube_video_id: "c", kanal: "Kanal Y", uygunluk_skoru: 85 }),
    ];
    const { gecen, elenen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 5, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["a", "c"]);
    expect(elenen.ayni_kanal).toBe(1);
  });

  it("uygunluk eşitken çok izlenen ve taze olan tercih edilir", () => {
    const rows = [
      row({ youtube_video_id: "az", kanal: "A", izlenme: 12_000, yayin_tarihi: "2022-06-01T00:00:00Z" }),
      row({ youtube_video_id: "cok", kanal: "B", izlenme: 900_000, yayin_tarihi: "2025-11-01T00:00:00Z" }),
    ];
    const { gecen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 1, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["cok"]);
  });

  it("izlenme ve tazelik, belirgin uygunluk farkını ezmez", () => {
    const rows = [
      row({ youtube_video_id: "uygun", kanal: "A", uygunluk_skoru: 95, izlenme: 11_000, yayin_tarihi: "2022-06-01T00:00:00Z" }),
      row({ youtube_video_id: "populer", kanal: "B", uygunluk_skoru: 72, izlenme: 5_000_000, yayin_tarihi: "2025-12-25T00:00:00Z" }),
    ];
    const { gecen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 1, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["uygun"]);
  });
});

describe("siralamaSkoru", () => {
  it("izlenmesiz ve tarihsiz aday yalnızca uygunluk payını alır", () => {
    const r = row({ izlenme: null, yayin_tarihi: null, uygunluk_skoru: 100 });
    expect(siralamaSkoru(r, SIRALAMA)).toBeCloseTo(75, 5);
  });

  it("bozuk yayın tarihi tazelik bonusu kazandırmaz", () => {
    const bozuk = row({ izlenme: null, yayin_tarihi: "dün", uygunluk_skoru: 100 });
    expect(siralamaSkoru(bozuk, SIRALAMA)).toBeCloseTo(75, 5);
  });

  it("yaş sınırından eski aday tazelikte 0 alır, negatife düşmez", () => {
    const eski = row({ izlenme: null, yayin_tarihi: "2010-01-01T00:00:00Z", uygunluk_skoru: 0 });
    expect(siralamaSkoru(eski, SIRALAMA)).toBe(0);
  });

  it("her boyutta tam puan alan aday 100 döner", () => {
    const mukemmel = row({ izlenme: 5_000_000, yayin_tarihi: NOW.toISOString(), uygunluk_skoru: 100 });
    expect(siralamaSkoru(mukemmel, SIRALAMA)).toBeCloseTo(100, 5);
  });
});
