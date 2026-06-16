"use server";

import { createClient } from "@/lib/supabase/server";

// Kazanılan dal yetkinliklerini kalıcılaştırır; yalnız YENİ eklenenleri döner (bildirim için).
export async function syncCompetencies(
  userId: string,
  earnedSlugs: string[],
): Promise<{ yeni: string[] }> {
  try {
    if (earnedSlugs.length === 0) return { yeni: [] };
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("user_competencies")
      .select("track_slug")
      .eq("user_id", userId);
    const have = new Set((existing ?? []).map((r: { track_slug: string }) => r.track_slug));

    const yeni = earnedSlugs.filter((s) => !have.has(s));
    if (yeni.length > 0) {
      const { error } = await supabase
        .from("user_competencies")
        .insert(yeni.map((track_slug) => ({ user_id: userId, track_slug })));
      if (error) {
        console.error("syncCompetencies insert hatası:", error);
        return { yeni: [] };
      }
    }
    return { yeni };
  } catch (e) {
    console.error("syncCompetencies beklenmeyen hata:", e);
    return { yeni: [] };
  }
}
