import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberProfile = {
  gorunenAd: string;
  puan: number;
  tamamlananDers: number;
  onayliGorev: number;
  sira: number;
  yetkinlikler: string[];
};

type RawRow = {
  gorunen_ad: string | null;
  puan: number | null;
  tamamlanan_ders: number | null;
  onayli_gorev: number | null;
  sira: number | null;
  yetkinlikler: string[] | null;
};

// member_profile RPC: toplu, hassas-olmayan üye özeti. RPC yoksa/hata → null (graceful).
export async function getMemberProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberProfile | null> {
  try {
    const { data, error } = await supabase.rpc("member_profile", { p_user_id: userId });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as RawRow | undefined;
    if (!row || !row.gorunen_ad) return null;
    return {
      gorunenAd: row.gorunen_ad,
      puan: row.puan ?? 0,
      tamamlananDers: row.tamamlanan_ders ?? 0,
      onayliGorev: row.onayli_gorev ?? 0,
      sira: Number(row.sira ?? 0),
      yetkinlikler: row.yetkinlikler ?? [],
    };
  } catch {
    return null;
  }
}
