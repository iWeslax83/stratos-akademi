import type { ScanPorts, ScanSummary, PendingRow, ScanDiag } from "@/lib/videos/types";
import { buildQueries } from "@/lib/videos/queries";
import { filtreleVeSay, bosEleme } from "@/lib/videos/filter";
import { kaliteKapisi, siralamaSkoru } from "@/lib/videos/kalite";

const VARSAYILAN_ESIKLER = { minViews: 10000, minDurationSn: 180, maxAgeYears: 4 };

function bosDiag(): ScanDiag {
  return {
    modul_sayisi: 0, sorgu_sayisi: 0, arama_sonucu: 0, tekil_id: 0, detay_cekilen: 0,
    eleme: bosEleme(), filtreden_gecen: 0, siniflandirilan: 0,
    gemini_uygun: 0, gemini_uygunsuz: 0, gemini_hata: 0,
    kalite_eleme: { dusuk_skor: 0, modul_dolu: 0, ayni_kanal: 0 },
    hatalar: [],
  };
}

export async function runVideoScan(ports: ScanPorts): Promise<ScanSummary> {
  const diag = bosDiag();
  const bitir = async (s: ScanSummary, hata: string | null = null): Promise<ScanSummary> => {
    s.diag.hatalar = ports.getErrors ? ports.getErrors() : [];
    await ports.recordRun?.(s, hata);
    return s;
  };

  const { tracks, modules } = await ports.getCurriculum();
  diag.modul_sayisi = modules.length;
  if (modules.length === 0) {
    return bitir({ taranan: 0, aday: 0, eklenen: 0, budanan: 0, diag }, "müfredatta modül yok");
  }

  const existing = await ports.getExistingIds();
  const queries = buildQueries(tracks, modules);
  diag.sorgu_sayisi = queries.length;
  if (queries.length === 0) {
    return bitir(
      { taranan: 0, aday: 0, eklenen: 0, budanan: 0, diag },
      "hiç arama sorgusu üretilemedi (modüllerin track_id'si geçersiz olabilir)",
    );
  }

  const idSet = new Set<string>();
  for (const q of queries) {
    const ids = await ports.searchVideoIds(q);
    diag.arama_sonucu += ids.length;
    ids.forEach((id) => idSet.add(id));
  }
  diag.tekil_id = idSet.size;

  const details = await ports.fetchVideoDetails([...idSet]);
  diag.detay_cekilen = details.length;

  const esikler = ports.esikler ?? VARSAYILAN_ESIKLER;
  const { gecen, eleme } = filtreleVeSay(details, { now: ports.now, ...esikler, existingIds: existing });
  diag.eleme = eleme;
  diag.filtreden_gecen = gecen.length;

  const filtered = gecen.slice(0, ports.maxCandidates);
  diag.siniflandirilan = filtered.length;

  // Tazelik, mekanik filtreyle aynı yaş sınırına göre ölçülür: filtreden geçen en eski
  // video tazelikte tam 0 alsın.
  const siralama = { now: ports.now, maxAgeYears: esikler.maxAgeYears };

  const rows: PendingRow[] = [];
  for (const v of filtered) {
    const c = await ports.classify(v, modules);
    if (!c) { diag.gemini_hata += 1; continue; }
    if (!c.uygun || !c.module_id) { diag.gemini_uygunsuz += 1; continue; }
    diag.gemini_uygun += 1;
    const aday = {
      youtube_video_id: v.youtube_video_id,
      baslik: v.baslik,
      aciklama: v.aciklama || null,
      kanal: v.kanal || null,
      sure_sn: v.sure_sn || null,
      izlenme: v.izlenme || null,
      yayin_tarihi: v.yayin_tarihi || null,
      onerilen_module_id: c.module_id,
      uygunluk_skoru: c.skor,
      gerekce: c.gerekce,
      durum: "pending" as const,
    };
    rows.push({ ...aday, siralama_skoru: siralamaSkoru(aday, siralama) });
  }

  // Kalite kapısı: düşük güvenli, tek modüle yığılan ve tek kanaldan tekrar eden adaylar
  // kuyruğa girmesin. Kapatmak için ports.kalite = null.
  let yazilacak = rows;
  if (ports.kalite !== null) {
    const kalite = ports.kalite ?? { minSkor: 70, modulBasinaMax: 3 };
    const mevcut = ports.getPendingCountsByModule ? await ports.getPendingCountsByModule() : {};
    const { gecen, elenen } = kaliteKapisi(rows, { ...kalite, mevcutModulSayilari: mevcut });
    diag.kalite_eleme = elenen;
    yazilacak = gecen;
  }

  if (yazilacak.length > 0) await ports.insertPending(yazilacak);
  const budanan = await ports.prune();
  if (yazilacak.length > 0) await ports.notifyAdmins(yazilacak.length);

  return bitir({
    taranan: details.length,
    aday: filtered.length,
    eklenen: yazilacak.length,
    budanan,
    diag,
  });
}
