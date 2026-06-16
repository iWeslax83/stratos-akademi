import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderRow = { userId: string; gorunenAd: string; puan: number; sira: number };

export async function getLeaderboard(supabase: SupabaseClient): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard");
  if (error || !data) {
    if (error) console.error("getLeaderboard RPC hatası:", error);
    return [];
  }
  return (data as { user_id: string; gorunen_ad: string; puan: number; sira: number }[]).map((r) => ({
    userId: r.user_id,
    gorunenAd: r.gorunen_ad,
    puan: r.puan,
    sira: Number(r.sira),
  }));
}
