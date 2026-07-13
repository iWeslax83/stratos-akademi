import { describe, it, expect } from "vitest";
import { kaliteKapisi } from "@/lib/videos/kalite";
import type { PendingRow } from "@/lib/videos/types";

function row(over: Partial<PendingRow> = {}): PendingRow {
  return {
    youtube_video_id: "v1", baslik: "Ders", aciklama: null, kanal: "K",
    sure_sn: 600, izlenme: 20000, yayin_tarihi: "2025-01-01T00:00:00Z",
    onerilen_module_id: "m1", uygunluk_skoru: 90, gerekce: "", durum: "pending",
    ...over,
  };
}

describe("kaliteKapisi", () => {
  it("eşik altı skorları eler", () => {
    const rows = [row({ youtube_video_id: "a", uygunluk_skoru: 90 }), row({ youtube_video_id: "b", uygunluk_skoru: 65 })];
    const { gecen, elenen } = kaliteKapisi(rows, { minSkor: 70, modulBasinaMax: 5, mevcutModulSayilari: {} });
    expect(gecen.map((r) => r.youtube_video_id)).toEqual(["a"]);
    expect(elenen.dusuk_skor).toBe(1);
  });

  it("modül başına sınırı aşanları eler, en yüksek skorluları tutar", () => {
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
});
