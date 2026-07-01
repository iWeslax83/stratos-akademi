import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanPorts, PendingRow, TrackRow, ModuleRow } from "@/lib/videos/types";
import { searchVideoIds, fetchVideoDetails } from "@/lib/videos/youtube-api";
import { geminiClassify } from "@/lib/videos/classify";
import { computePrune, type RejectedRow } from "@/lib/videos/prune";

// svc = createServiceClient() (RLS bypass). now enjekte edilebilir (test/deterministiklik).
export function createProductionPorts(
  svc: SupabaseClient,
  deps: { youtubeKey: string; geminiKey: string; now?: Date },
): ScanPorts {
  const now = deps.now ?? new Date();
  const publishedAfter = new Date(now.getTime() - 4 * 365.25 * 24 * 3600 * 1000).toISOString();

  return {
    now,
    maxCandidates: 20,

    async getCurriculum() {
      const { data: tracks } = await svc.from("tracks").select("id, ad");
      const { data: modules } = await svc.from("modules").select("id, track_id, ad");
      return { tracks: (tracks ?? []) as TrackRow[], modules: (modules ?? []) as ModuleRow[] };
    },

    async getExistingIds() {
      const ids = new Set<string>();
      const { data: l } = await svc.from("lessons").select("youtube_video_id");
      const { data: s } = await svc.from("video_suggestions").select("youtube_video_id");
      const { data: b } = await svc.from("video_blacklist").select("youtube_video_id");
      for (const r of [...(l ?? []), ...(s ?? []), ...(b ?? [])] as { youtube_video_id: string }[]) {
        if (r.youtube_video_id) ids.add(r.youtube_video_id);
      }
      return ids;
    },

    searchVideoIds: (q) => searchVideoIds(q, { apiKey: deps.youtubeKey, publishedAfter }),
    fetchVideoDetails: (ids) => fetchVideoDetails(ids, { apiKey: deps.youtubeKey }),
    classify: (v, modules) => geminiClassify(v, modules, { apiKey: deps.geminiKey }),

    async insertPending(rows: PendingRow[]) {
      // youtube_video_id unique → çakışanları yok say.
      await svc.from("video_suggestions").upsert(rows, {
        onConflict: "youtube_video_id",
        ignoreDuplicates: true,
      });
    },

    async prune() {
      const { data } = await svc
        .from("video_suggestions")
        .select("id, youtube_video_id, rejected_at")
        .eq("durum", "rejected");
      const rejected = ((data ?? []) as RejectedRow[]).filter((r) => r.rejected_at);
      const { deleteIds, blacklistVideoIds } = computePrune(rejected, now);
      if (deleteIds.length === 0) return 0;
      if (blacklistVideoIds.length > 0) {
        await svc.from("video_blacklist").upsert(
          blacklistVideoIds.map((youtube_video_id) => ({ youtube_video_id })),
          { onConflict: "youtube_video_id", ignoreDuplicates: true },
        );
      }
      await svc.from("video_suggestions").delete().in("id", deleteIds);
      return deleteIds.length;
    },

    async notifyAdmins(newCount: number) {
      const { data: admins } = await svc.from("profiles").select("id").eq("role", "admin");
      const rows = ((admins ?? []) as { id: string }[]).map((a) => ({
        user_id: a.id,
        mesaj: `${newCount} yeni video önerisi`,
        link: "/admin/oneriler",
      }));
      if (rows.length > 0) await svc.from("notifications").insert(rows);
    },
  };
}
