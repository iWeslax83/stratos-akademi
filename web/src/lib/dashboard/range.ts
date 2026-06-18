export type Aralik = "tum" | "ay" | "hafta";

const DAY_MS = 24 * 60 * 60 * 1000;

// Seçili aralığın başlangıç ISO tarihi (tüm zamanlar → null). Rolling pencere.
export function rangeStartISO(aralik: Aralik, nowMs: number): string | null {
  if (aralik === "hafta") return new Date(nowMs - 7 * DAY_MS).toISOString();
  if (aralik === "ay") return new Date(nowMs - 30 * DAY_MS).toISOString();
  return null;
}

export function parseAralik(v: string | undefined): Aralik {
  return v === "ay" || v === "hafta" ? v : "tum";
}

export function aralikLabel(aralik: Aralik): string {
  if (aralik === "hafta") return "Son 7 gün";
  if (aralik === "ay") return "Son 30 gün";
  return "Tüm zamanlar";
}
