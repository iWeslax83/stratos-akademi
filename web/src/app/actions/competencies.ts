"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { actorId } from "@/lib/auth/actor";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";

// Kazanılan dal yetkinliklerini kalıcılaştırır (uye/[id] profil rozetleri + "yeni kazandın"
// bildirimi için). GÜVENLİK (0038): user_competencies artık authenticated'a kapalı; hangi
// dalların kazanıldığı İSTEMCİDEN ALINMAZ — sunucu lesson_progress'ten yeniden hesaplar.
// Okumalar çağıranın kendi client'ıyla (RLS: kendi ilerlemesi/yetkinliği), yazma service_role
// ile (0038 öncesi authenticated'a düşer). Yalnız YENİ eklenenleri döner.
export async function syncCompetencies(): Promise<{ yeni: string[] }> {
  try {
    const supabase = await createClient();
    const uid = await actorId(supabase);
    if (!uid) return { yeni: [] };

    const [curriculum, completed] = await Promise.all([
      getCurriculum(supabase),
      getCompletedLessonIds(supabase, uid),
    ]);

    // Bir dalın TÜM dersleri tamamlandıysa o dal kazanılmıştır.
    const earned = curriculum
      .filter((t) => {
        const lessons = t.modules.flatMap((m) => m.lessons);
        return lessons.length > 0 && lessons.every((l) => completed.has(l.id));
      })
      .map((t) => t.slug);
    if (earned.length === 0) return { yeni: [] };

    const { data: existing } = await supabase
      .from("user_competencies")
      .select("track_slug")
      .eq("user_id", uid);
    const have = new Set((existing ?? []).map((r: { track_slug: string }) => r.track_slug));

    const yeni = earned.filter((s) => !have.has(s));
    if (yeni.length === 0) return { yeni: [] };

    const rows = yeni.map((track_slug) => ({ user_id: uid, track_slug }));
    const { error: svcErr } = await createServiceClient().from("user_competencies").insert(rows);
    if (svcErr) {
      // 0038 öncesi: service_role grant yok → authenticated client (RLS: user_id = auth.uid()).
      const { error: authErr } = await supabase.from("user_competencies").insert(rows);
      if (authErr) {
        console.error("syncCompetencies insert:", { svcErr, authErr });
        return { yeni: [] };
      }
    }
    return { yeni };
  } catch (e) {
    console.error("syncCompetencies beklenmeyen hata:", e);
    return { yeni: [] };
  }
}
