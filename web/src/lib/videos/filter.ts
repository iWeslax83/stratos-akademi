import type { VideoDetail, FilterOpts, RedNedeni } from "@/lib/videos/types";
import { detectLang } from "@/lib/videos/lang";

function ageYears(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now.getTime() - t) / (365.25 * 24 * 3600 * 1000);
}

// Elenme nedeni, ya da geçtiyse null. Sıra önemli: ilk eşleşen neden raporlanır.
export function redNedeni(v: VideoDetail, opts: FilterOpts): RedNedeni | null {
  if (opts.existingIds.has(v.youtube_video_id)) return "zaten_var";
  if (v.isLiveRemnant) return "canli_yayin";
  if (!v.embeddable) return "gomulemez";
  if (v.blockedInTR) return "tr_engelli";
  if ((v.izlenme ?? 0) < opts.minViews) return "az_izlenme";
  if ((v.sure_sn ?? 0) < opts.minDurationSn) return "kisa_sure";
  if (ageYears(v.yayin_tarihi, opts.now) > opts.maxAgeYears) return "eski";
  if (detectLang(`${v.baslik} ${v.aciklama}`) === "other") return "dil";
  return null;
}

export function bosEleme(): Record<RedNedeni, number> {
  return {
    zaten_var: 0, canli_yayin: 0, gomulemez: 0, tr_engelli: 0,
    az_izlenme: 0, kisa_sure: 0, eski: 0, dil: 0,
  };
}

export function passesFilter(v: VideoDetail, opts: FilterOpts): boolean {
  return redNedeni(v, opts) === null;
}

// Geçenleri ve her nedenin kaç videoyu elediğini birlikte döner (teşhis hunisi).
export function filtreleVeSay(
  vs: VideoDetail[],
  opts: FilterOpts,
): { gecen: VideoDetail[]; eleme: Record<RedNedeni, number> } {
  const seen = new Set<string>();
  const gecen: VideoDetail[] = [];
  const eleme = bosEleme();
  for (const v of vs) {
    if (seen.has(v.youtube_video_id)) continue;
    seen.add(v.youtube_video_id);
    const neden = redNedeni(v, opts);
    if (neden) { eleme[neden] += 1; continue; }
    gecen.push(v);
  }
  return { gecen, eleme };
}

export function mechanicalFilter(vs: VideoDetail[], opts: FilterOpts): VideoDetail[] {
  return filtreleVeSay(vs, opts).gecen;
}
