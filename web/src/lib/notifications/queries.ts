import type { SupabaseClient } from "@supabase/supabase-js";

export type Notification = {
  id: string;
  mesaj: string;
  link: string | null;
  okundu: boolean;
  created_at: string;
};

// Kendi bildirimleri (RLS), yeni→eski. Tablo yoksa/hata → [].
export async function getNotifications(supabase: SupabaseClient): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, mesaj, link, okundu, created_at")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as Notification[];
  } catch {
    return [];
  }
}

// Kendi okunmamış sayısı (RLS). Tablo yoksa/hata → 0.
export async function unreadCount(supabase: SupabaseClient): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("okundu", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
