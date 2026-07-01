export type RejectedRow = { id: string; youtube_video_id: string; rejected_at: string };

// Silinecekler: (1 aydan eski) VEYA (en yeni maxKeep'in dışında kalan). Çöp kutusu
// her zaman en fazla maxKeep kayıt tutar ve maxAgeDays'ten eski hiçbir şey tutmaz.
export function computePrune(
  rejected: RejectedRow[],
  now: Date,
  opts: { maxKeep?: number; maxAgeDays?: number } = {},
): { deleteIds: string[]; blacklistVideoIds: string[] } {
  const maxKeep = opts.maxKeep ?? 30;
  const maxAgeMs = (opts.maxAgeDays ?? 30) * 24 * 3600 * 1000;
  const sorted = [...rejected].sort(
    (a, b) => Date.parse(b.rejected_at) - Date.parse(a.rejected_at),
  );
  const deleteIds: string[] = [];
  const blacklistVideoIds: string[] = [];
  sorted.forEach((r, idx) => {
    const tooOld = now.getTime() - Date.parse(r.rejected_at) > maxAgeMs;
    const beyondKeep = idx >= maxKeep;
    if (tooOld || beyondKeep) {
      deleteIds.push(r.id);
      blacklistVideoIds.push(r.youtube_video_id);
    }
  });
  return { deleteIds, blacklistVideoIds };
}
