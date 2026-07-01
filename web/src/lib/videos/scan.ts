import type { ScanPorts, ScanSummary, PendingRow } from "@/lib/videos/types";
import { buildQueries } from "@/lib/videos/queries";
import { mechanicalFilter } from "@/lib/videos/filter";

export async function runVideoScan(ports: ScanPorts): Promise<ScanSummary> {
  const { tracks, modules } = await ports.getCurriculum();
  if (modules.length === 0) return { taranan: 0, aday: 0, eklenen: 0, budanan: 0 };

  const existing = await ports.getExistingIds();
  const queries = buildQueries(tracks, modules);

  const idSet = new Set<string>();
  for (const q of queries) {
    const ids = await ports.searchVideoIds(q);
    ids.forEach((id) => idSet.add(id));
  }

  const details = await ports.fetchVideoDetails([...idSet]);
  const filtered = mechanicalFilter(details, {
    now: ports.now,
    minViews: 10000,
    minDurationSn: 180,
    maxAgeYears: 4,
    existingIds: existing,
  }).slice(0, ports.maxCandidates);

  const rows: PendingRow[] = [];
  for (const v of filtered) {
    const c = await ports.classify(v, modules);
    if (!c || !c.uygun || !c.module_id) continue;
    rows.push({
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
      durum: "pending",
    });
  }

  if (rows.length > 0) await ports.insertPending(rows);
  const budanan = await ports.prune();
  if (rows.length > 0) await ports.notifyAdmins(rows.length);

  return { taranan: details.length, aday: filtered.length, eklenen: rows.length, budanan };
}
