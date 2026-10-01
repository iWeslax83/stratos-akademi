"use server";

import { createClient } from "@/lib/supabase/server";
import { actorId } from "@/lib/auth/actor";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { persistCompetencies } from "@/lib/dashboard/sync-competencies";

// GÜVENLİK (0038): hangi dalların kazanıldığı İSTEMCİDEN ALINMAZ, sunucu lesson_progress'ten
// yeniden hesaplar. Pano artık persistCompetencies'i kendi okuduğu veriyle doğrudan çağırır;
// bu action yalnız istemciden tetiklemek isteyenler için ince bir sarmalayıcıdır.
export async function syncCompetencies(): Promise<{ yeni: string[] }> {
  try {
    const supabase = await createClient();
    const uid = await actorId(supabase);
    if (!uid) return { yeni: [] };
    const [curriculum, completed] = await Promise.all([
      getCurriculum(supabase),
      getCompletedLessonIds(supabase, uid),
    ]);
    return { yeni: await persistCompetencies(supabase, uid, curriculum, completed) };
  } catch (e) {
    console.error("syncCompetencies beklenmeyen hata:", e);
    return { yeni: [] };
  }
}
