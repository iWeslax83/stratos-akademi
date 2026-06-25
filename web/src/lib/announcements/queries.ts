import type { SupabaseClient } from "@supabase/supabase-js";

export type Announcement = {
  id: string;
  baslik: string;
  icerik: string;
  created_at: string;
};

// Duyuruları en yeniden eskiye çeker (opsiyonel limit: panom kartı için).
export async function getAnnouncements(
  supabase: SupabaseClient,
  limit?: number,
): Promise<Announcement[]> {
  let q = supabase
    .from("announcements")
    .select("id, baslik, icerik, created_at")
    .order("created_at", { ascending: false });
  if (limit != null) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as Announcement[];
}
