import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanPorts, PendingRow, TrackRow, ModuleRow, ScanSummary, Esikler } from "@/lib/videos/types";
import { searchVideoIds, fetchVideoDetails } from "@/lib/videos/youtube-api";
import { geminiClassify } from "@/lib/videos/classify";
import { computePrune, type RejectedRow } from "@/lib/videos/prune";

export const VARSAYILAN_ESIKLER: Esikler = {
  minViews: 10000,
  minDurationSn: 180,
  maxAgeYears: 4,
};

// Eşikleri ortam değişkeniyle gevşetebilmek için (küçük/niş müfredatlarda 10k izlenme çok sert olabilir).
function esiklerFromEnv(): Esikler {
  const n = (v: string | undefined, d: number) => {
    const x = Number(v);
    return Number.isFinite(x) && x >= 0 ? x : d;
  };
  return {
    minViews: n(process.env.VIDEO_MIN_VIEWS, VARSAYILAN_ESIKLER.minViews),
    minDurationSn: n(process.env.VIDEO_MIN_SURE_SN, VARSAYILAN_ESIKLER.minDurationSn),
    maxAgeYears: n(process.env.VIDEO_MAX_YAS_YIL, VARSAYILAN_ESIKLER.maxAgeYears),
  };
}

// svc = createServiceClient() (RLS bypass). now enjekte edilebilir (test/deterministiklik).
export function createProductionPorts(
  svc: SupabaseClient,
  deps: { youtubeKey: string; geminiKey: string; now?: Date; esikler?: Esikler },
): ScanPorts {
  const now = deps.now ?? new Date();
  const esikler = deps.esikler ?? esiklerFromEnv();
  const publishedAfter = new Date(
    now.getTime() - esikler.maxAgeYears * 365.25 * 24 * 3600 * 1000,
  ).toISOString();

  // YouTube/Gemini çağrılarında biriken hatalar — tarama kaydına ve admin teşhis paneline gider.
  const hatalar: string[] = [];
  const onError = (m: string) => {
    if (hatalar.length < 20 && !hatalar.includes(m)) hatalar.push(m);
  };

  return {
    now,
    maxCandidates: 20,
    esikler,
    getErrors: () => hatalar,

    async getCurriculum() {
      const { data: tracks, error: tErr } = await svc.from("tracks").select("id, ad");
      const { data: modules, error: mErr } = await svc.from("modules").select("id, track_id, ad");
      if (tErr) onError(`tracks okunamadı: ${tErr.message}`);
      if (mErr) onError(`modules okunamadı: ${mErr.message}`);
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

    searchVideoIds: (q) => searchVideoIds(q, { apiKey: deps.youtubeKey, publishedAfter, onError }),
    fetchVideoDetails: (ids) => fetchVideoDetails(ids, { apiKey: deps.youtubeKey, onError }),
    classify: (v, modules) => geminiClassify(v, modules, { apiKey: deps.geminiKey, onError }),

    async insertPending(rows: PendingRow[]) {
      // youtube_video_id unique → çakışanları yok say.
      const { error } = await svc.from("video_suggestions").upsert(rows, {
        onConflict: "youtube_video_id",
        ignoreDuplicates: true,
      });
      if (error) onError(`öneri yazılamadı: ${error.message}`);
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

    async recordRun(summary: ScanSummary, hata: string | null) {
      const { error } = await svc.from("video_scan_runs").insert({
        taranan: summary.taranan,
        aday: summary.aday,
        eklenen: summary.eklenen,
        budanan: summary.budanan,
        hata,
        diag: summary.diag,
      });
      if (error) console.error("video_scan_runs insert:", error.message);
    },
  };
}
