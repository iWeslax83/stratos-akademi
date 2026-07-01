import type { TrackRow, ModuleRow } from "@/lib/videos/types";

// Her modül için "TrackAdı ModülAdı" arama sorgusu; track'sizler atlanır, tekrarlar tekilleşir.
export function buildQueries(tracks: TrackRow[], modules: ModuleRow[]): string[] {
  const trackAd = new Map(tracks.map((t) => [t.id, t.ad]));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of modules) {
    const ad = trackAd.get(m.track_id);
    if (!ad) continue;
    const q = `${ad} ${m.ad}`.trim();
    if (seen.has(q)) continue;
    seen.add(q);
    out.push(q);
  }
  return out;
}
