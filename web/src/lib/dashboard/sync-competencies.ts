import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { Curriculum } from "@/lib/curriculum/types";

// Bir dalın TÜM dersleri tamamlandıysa o dal kazanılmıştır.
export function earnedTrackSlugs(curriculum: Curriculum, completed: Set<string>): string[] {
  return curriculum
    .filter((t) => {
      const lessons = t.modules.flatMap((m) => m.lessons);
      return lessons.length > 0 && lessons.every((l) => completed.has(l.id));
    })
    .map((t) => t.slug);
}

// Kazanılan dal yetkinliklerini kalıcılaştırır; yalnız YENİ eklenenleri döner.
// Müfredat ve tamamlanan dersler ÇAĞIRAN tarafından sunucuda okunmuş olmalı (istemciden
// gelen veriye güvenilmez, bkz. 0038). Okuma çağıranın client'ıyla (RLS), yazma service_role ile.
export async function persistCompetencies(
  supabase: SupabaseClient,
  uid: string,
  curriculum: Curriculum,
  completed: Set<string>,
): Promise<string[]> {
  try {
    const earned = earnedTrackSlugs(curriculum, completed);
    if (earned.length === 0) return [];

    const { data: existing } = await supabase
      .from("user_competencies")
      .select("track_slug")
      .eq("user_id", uid);
    const have = new Set((existing ?? []).map((r: { track_slug: string }) => r.track_slug));

    const yeni = earned.filter((s) => !have.has(s));
    if (yeni.length === 0) return [];

    const rows = yeni.map((track_slug) => ({ user_id: uid, track_slug }));
    const { error: svcErr } = await createServiceClient().from("user_competencies").insert(rows);
    if (svcErr) {
      // 0038 öncesi: service_role grant yok → authenticated client (RLS: user_id = auth.uid()).
      const { error: authErr } = await supabase.from("user_competencies").insert(rows);
      if (authErr) {
        console.error("persistCompetencies insert:", { svcErr, authErr });
        return [];
      }
    }
    return yeni;
  } catch (e) {
    console.error("persistCompetencies beklenmeyen hata:", e);
    return [];
  }
}
