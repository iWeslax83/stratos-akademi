import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaramaTeshis, type ScanRun } from "@/components/admin/TaramaTeshis";
import { bosEleme } from "@/lib/videos/filter";
import type { ScanDiag } from "@/lib/videos/types";

function run(over: Partial<ScanRun> = {}, diag: Partial<ScanDiag> = {}): ScanRun {
  return {
    id: "r1", created_at: "2026-09-21T15:43:00Z", taranan: 99, aday: 1, eklenen: 0, budanan: 0, hata: null,
    diag: {
      modul_sayisi: 10, sorgu_sayisi: 10, arama_sonucu: 100, tekil_id: 99, detay_cekilen: 99,
      eleme: { ...bosEleme(), az_izlenme: 57 }, filtreden_gecen: 1, siniflandirilan: 1,
      gemini_uygun: 0, gemini_uygunsuz: 1, gemini_hata: 0,
      kalite_eleme: { dusuk_skor: 0, modul_dolu: 0, ayni_kanal: 0 }, hatalar: [],
      ...diag,
    },
    ...over,
  };
}

describe("TaramaTeshis", () => {
  it("son tarama öneri üretmediyse Gemini'nin red gerekçelerini gösterir", () => {
    const r = run({}, { reddedilenler: [{ baslik: "Drone montajı", kanal: "Kanal A", skor: 30, gerekce: "Modülle ilgisiz." }] });
    render(<TaramaTeshis runs={[r]} />);
    expect(screen.getByText("Gemini'nin uygun bulmadıkları")).toBeInTheDocument();
    expect(screen.getByText(/Drone montajı \(Kanal A\), skor 30: Modülle ilgisiz\./)).toBeInTheDocument();
  });
  it("son taramada öneri çıktıysa da red gerekçeleri görünür", () => {
    const r = run({ eklenen: 2 }, { reddedilenler: [{ baslik: "Konu dışı", kanal: "K", skor: 5, gerekce: "İlgisiz." }] });
    render(<TaramaTeshis runs={[r]} />);
    expect(screen.getByText(/Konu dışı \(K\), skor 5: İlgisiz\./)).toBeInTheDocument();
  });
  it("sorgu bazında verimi açılır bir bölümde gösterir", () => {
    const r = run({}, { sorgu_ozeti: [{ sorgu: "Aviyonik Lehimleme", bulunan: 25, gecen: 0 }] });
    render(<TaramaTeshis runs={[r]} />);
    expect(screen.getByText("Sorgu bazında sonuç")).toBeInTheDocument();
    expect(screen.getByText("Aviyonik Lehimleme: 25 bulundu, 0 geçti")).toBeInTheDocument();
  });
  it("eski kayıtta (alan yok) başlık göstermez ve hata vermez", () => {
    render(<TaramaTeshis runs={[run()]} />);
    expect(screen.queryByText("Gemini'nin uygun bulmadıkları")).not.toBeInTheDocument();
  });
});
