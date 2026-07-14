import type { PendingRow } from "@/lib/videos/types";

export type KaliteOpts = {
  minSkor: number;
  modulBasinaMax: number;
  // Modül id → o modülde HÂLÂ bekleyen öneri sayısı. Kuyruğun tek bir modülle dolmasını önler.
  mevcutModulSayilari: Record<string, number>;
};

export type SiralamaOpts = {
  now: Date;
  // Tazeliğin sıfıra düştüğü yaş; mekanik filtrenin maxAgeYears'ı ile aynı olmalı ki
  // filtreden geçen en eski video tam 0 tazelik alsın.
  maxAgeYears: number;
};

// Skor, satır kurulurken hesaplanıp siralama_skoru'na yazılır — o yüzden girdi henüz
// tam bir PendingRow değil.
export type SiralamaGirdi = Pick<PendingRow, "uygunluk_skoru" | "izlenme" | "yayin_tarihi">;

export type KaliteElemesi = { dusuk_skor: number; modul_dolu: number; ayni_kanal: number };

// Sıralama ağırlıkları. Uygunluk baskın: izlenme + tazelik birlikte en fazla 25 puan
// sallayabilir, yani 100*0.75*Δ hesabıyla ~33 puandan büyük bir uygunluk farkını hiçbir
// popülerlik çeviremez. Amaç uygunluğu ezmek değil, yakın adaylar arasında ayırt etmek.
export const AGIRLIK = { uygunluk: 0.75, izlenme: 0.15, tazelik: 0.1 };

// İzlenme doyum noktası: bunun üstü ek puan getirmez. Logaritmik ölçek, çünkü 10k → 100k
// farkı 1M → 1.1M farkından çok daha anlamlı.
const IZLENME_DOYUM = 1_000_000;

function izlenmeSkoru(izlenme: number | null): number {
  const n = Math.max(0, izlenme ?? 0);
  if (n <= 0) return 0;
  return Math.min(1, Math.log10(1 + n) / Math.log10(1 + IZLENME_DOYUM));
}

// maxAgeYears yaşında 0, bugün yayımlanmışsa 1; arada doğrusal.
// Tarih yoksa/bozuksa 0: bilinmeyen tazelik bonus kazanmaz.
function tazelikSkoru(yayinTarihi: string | null, now: Date, maxAgeYears: number): number {
  if (!yayinTarihi || maxAgeYears <= 0) return 0;
  const t = Date.parse(yayinTarihi);
  if (Number.isNaN(t)) return 0;
  const yas = (now.getTime() - t) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.min(1, 1 - yas / maxAgeYears));
}

// Adayı sıralamak için 0–100 bileşik skor. Eleme eşiği (minSkor) buna DEĞİL, ham
// uygunluk_skoru'na bakar: çok izlenen taze bir video, konusu tutmuyorsa yine de elenmeli.
// numeric(5,2) sütununa yazılıyor; sıralama ile panelde görünen sayı ayrışmasın diye
// burada da 2 haneye yuvarlanır.
export function siralamaSkoru(v: SiralamaGirdi, opts: SiralamaOpts): number {
  const uygunluk = Math.max(0, Math.min(100, v.uygunluk_skoru)) / 100;
  const ham = 100 * (
    AGIRLIK.uygunluk * uygunluk +
    AGIRLIK.izlenme * izlenmeSkoru(v.izlenme) +
    AGIRLIK.tazelik * tazelikSkoru(v.yayin_tarihi, opts.now, opts.maxAgeYears)
  );
  return Math.round(ham * 100) / 100;
}

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

  // En yüksek bileşik skor önce: sınır dolduğunda zayıf olan elensin.
  const sirali = [...rows].sort((a, b) => b.siralama_skoru - a.siralama_skoru);

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
