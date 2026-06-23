"use server";

import { createClient } from "@/lib/supabase/server";

// Kazanılan rozetleri kalıcılaştırır; yalnız YENİ eklenenlerin id'lerini döner (toast için).
// user_badges tablosu yoksa (migration uygulanmadıysa) graceful: { yeni: [] }.
export async function syncBadges(userId: string, earnedIds: string[]): Promise<{ yeni: string[] }> {
  try {
    if (earnedIds.length === 0) return { yeni: [] };
    const supabase = await createClient();

    const { data: existing, error: selErr } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);
    if (selErr) return { yeni: [] }; // tablo yok / izin yok → sessiz

    const have = new Set((existing ?? []).map((r: { badge_id: string }) => r.badge_id));
    const yeni = earnedIds.filter((id) => !have.has(id));
    if (yeni.length > 0) {
      const { error } = await supabase
        .from("user_badges")
        .insert(yeni.map((badge_id) => ({ user_id: userId, badge_id })));
      if (error) {
        console.error("syncBadges insert hatası:", error);
        return { yeni: [] };
      }
    }
    return { yeni };
  } catch (e) {
    console.error("syncBadges beklenmeyen hata:", e);
    return { yeni: [] };
  }
}
