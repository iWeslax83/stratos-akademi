import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventLite } from "./format";

export type EventRow = EventLite;

// Tüm etkinlikler, başlangıca göre artan (liste sayfaları partitionEvents ile ayırır).
export async function getEvents(supabase: SupabaseClient): Promise<EventRow[]> {
  const { data } = await supabase
    .from("events")
    .select("id, baslik, aciklama, baslangic, yer")
    .order("baslangic", { ascending: true });
  return (data ?? []) as EventRow[];
}

// Yaklaşan etkinlikler (panom kartı): baslangic >= şimdi, artan, limitli.
export async function getUpcomingEvents(supabase: SupabaseClient, limit: number): Promise<EventRow[]> {
  const { data } = await supabase
    .from("events")
    .select("id, baslik, aciklama, baslangic, yer")
    .gte("baslangic", new Date().toISOString())
    .order("baslangic", { ascending: true })
    .limit(limit);
  return (data ?? []) as EventRow[];
}
