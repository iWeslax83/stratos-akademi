import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderRow = { userId: string; gorunenAd: string; puan: number; sira: number };

type RawRow = { user_id: string; gorunen_ad: string; puan: number; sira: number };

function mapRows(data: RawRow[]): LeaderRow[] {
  return data.map((r) => ({
    userId: r.user_id,
    gorunenAd: r.gorunen_ad,
    puan: r.puan,
    sira: Number(r.sira),
  }));
}

// Tüm zamanlar (dashboard mini + /liderlik "tüm" sekmesi).
export async function getLeaderboard(supabase: SupabaseClient): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard");
  if (error || !data) {
    if (error) console.error("getLeaderboard RPC hatası:", error);
    return [];
  }
  return mapRows(data as RawRow[]);
}

// Zaman aralıklı (baslangic ISO veya null). RPC yoksa/hata → [] (graceful).
export async function getLeaderboardRanged(
  supabase: SupabaseClient,
  baslangic: string | null,
): Promise<LeaderRow[]> {
  try {
    const { data, error } = await supabase.rpc("leaderboard_ranged", { baslangic });
    if (error || !data) {
      if (error) console.error("getLeaderboardRanged RPC hatası:", error);
      return [];
    }
    return mapRows(data as RawRow[]);
  } catch (e) {
    console.error("getLeaderboardRanged:", e);
    return [];
  }
}
