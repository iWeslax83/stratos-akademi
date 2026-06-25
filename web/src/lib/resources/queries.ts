import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResourceLite } from "./group";

export type ResourceRow = ResourceLite;

// Tüm kaynaklar, en yeniden eskiye (liste sayfası groupByCategory ile gruplar).
export async function getResources(supabase: SupabaseClient): Promise<ResourceRow[]> {
  const { data } = await supabase
    .from("resources")
    .select("id, baslik, url, kategori, aciklama")
    .order("created_at", { ascending: false });
  return (data ?? []) as ResourceRow[];
}
