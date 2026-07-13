export type Kolon<T> = { baslik: string; deger: (satir: T) => string | number | null };

function hucre(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  // Tırnak, ayraç veya satır sonu varsa alan tırnaklanır; içteki tırnak ikilenir (RFC 4180).
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Excel'in Türkçe yerelinde ayraç olarak ';' beklenir ve BOM olmadan UTF-8 metni bozar.
export function toCsv<T>(rows: T[], kolonlar: Kolon<T>[]): string {
  const satirlar = [
    kolonlar.map((k) => hucre(k.baslik)).join(";"),
    ...rows.map((r) => kolonlar.map((k) => hucre(k.deger(r))).join(";")),
  ];
  return "﻿" + satirlar.join("\r\n") + "\r\n";
}

// "stratos-uyeler-2026-07-13.csv"
export function dosyaAdi(tip: string, now: Date): string {
  return `stratos-${tip}-${now.toISOString().slice(0, 10)}.csv`;
}
