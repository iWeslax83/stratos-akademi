import { describe, it, expect } from "vitest";
import { toCsv, dosyaAdi } from "@/lib/admin/csv";

type Satir = { ad: string; puan: number; gun: number | null };
const kolonlar = [
  { baslik: "Ad", deger: (s: Satir) => s.ad },
  { baslik: "Puan", deger: (s: Satir) => s.puan },
  { baslik: "Son aktivite (gün)", deger: (s: Satir) => s.gun },
];

describe("toCsv", () => {
  it("başlık + satırları ';' ile yazar, BOM ekler", () => {
    const csv = toCsv([{ ad: "Ali", puan: 30, gun: 2 }], kolonlar);
    expect(csv.startsWith("﻿")).toBe(true); // Excel Türkçe karakteri bozmasın
    expect(csv).toContain("Ad;Puan;Son aktivite (gün)\r\n");
    expect(csv).toContain("Ali;30;2\r\n");
  });

  it("null'u boş hücre yapar", () => {
    expect(toCsv([{ ad: "Ay", puan: 0, gun: null }], kolonlar)).toContain("Ay;0;\r\n");
  });

  it("ayraç, tırnak ve satır sonu içeren değeri kaçırır", () => {
    const csv = toCsv([{ ad: 'Ali; "Reis"\nİkinci', puan: 1, gun: 0 }], kolonlar);
    expect(csv).toContain('"Ali; ""Reis""\nİkinci";1;0');
  });

  it("satır yoksa yalnız başlık döner", () => {
    expect(toCsv([], kolonlar)).toBe("﻿Ad;Puan;Son aktivite (gün)\r\n");
  });
});

describe("dosyaAdi", () => {
  it("tip ve tarih içerir", () => {
    expect(dosyaAdi("uyeler", new Date("2026-07-13T10:00:00Z"))).toBe("stratos-uyeler-2026-07-13.csv");
  });
});
