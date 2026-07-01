import type { VideoDetail, FilterOpts } from "@/lib/videos/types";
import { detectLang } from "@/lib/videos/lang";

function ageYears(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now.getTime() - t) / (365.25 * 24 * 3600 * 1000);
}

export function passesFilter(v: VideoDetail, opts: FilterOpts): boolean {
  if (opts.existingIds.has(v.youtube_video_id)) return false;
  if (v.isLiveRemnant) return false;
  if (!v.embeddable) return false;
  if (v.blockedInTR) return false;
  if ((v.izlenme ?? 0) < opts.minViews) return false;
  if ((v.sure_sn ?? 0) < opts.minDurationSn) return false;
  if (ageYears(v.yayin_tarihi, opts.now) > opts.maxAgeYears) return false;
  const lang = detectLang(`${v.baslik} ${v.aciklama}`);
  if (lang === "other") return false;
  return true;
}

export function mechanicalFilter(vs: VideoDetail[], opts: FilterOpts): VideoDetail[] {
  const seen = new Set<string>();
  const out: VideoDetail[] = [];
  for (const v of vs) {
    if (seen.has(v.youtube_video_id)) continue;
    if (!passesFilter(v, opts)) continue;
    seen.add(v.youtube_video_id);
    out.push(v);
  }
  return out;
}
