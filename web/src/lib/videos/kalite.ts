import type { PendingRow } from "@/lib/videos/types";

export type KaliteOpts = {
  minSkor: number;
  modulBasinaMax: number;
  // Modül id → o modülde HÂLÂ bekleyen öneri sayısı. Kuyruğun tek bir modülle dolmasını önler.
  mevcutModulSayilari: Record<string, number>;
};

export type KaliteElemesi = { dusuk_skor: number; modul_dolu: number; ayni_kanal: number };

// Gemini'nin uygun bulduğu adayları admin kuyruğuna girmeden önce süzer:
// düşük güven, tek modüle yığılma ve tek kanaldan tekrar — hepsi kuyruğu çöple doldurur.
export function kaliteKapisi(
  rows: PendingRow[],
  opts: KaliteOpts,
): { gecen: PendingRow[]; elenen: KaliteElemesi } {
  const elenen: KaliteElemesi = { dusuk_skor: 0, modul_dolu: 0, ayni_kanal: 0 };
  const sayac = { ...opts.mevcutModulSayilari };
  const kanalGorulen = new Set<string>();
  const gecen: PendingRow[] = [];

  // En yüksek skor önce: sınır dolduğunda zayıf olan elensin.
  const sirali = [...rows].sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);

  for (const r of sirali) {
    if (r.uygunluk_skoru < opts.minSkor) { elenen.dusuk_skor += 1; continue; }

    const kanalAnahtar = `${r.onerilen_module_id}::${(r.kanal ?? "").toLowerCase()}`;
    if (r.kanal && kanalGorulen.has(kanalAnahtar)) { elenen.ayni_kanal += 1; continue; }

    const mevcut = sayac[r.onerilen_module_id] ?? 0;
    if (mevcut >= opts.modulBasinaMax) { elenen.modul_dolu += 1; continue; }

    sayac[r.onerilen_module_id] = mevcut + 1;
    if (r.kanal) kanalGorulen.add(kanalAnahtar);
    gecen.push(r);
  }

  return { gecen, elenen };
}
