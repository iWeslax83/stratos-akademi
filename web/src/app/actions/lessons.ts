"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { actorId } from "@/lib/auth/actor";
import { WATCHED_THRESHOLD } from "@/lib/curriculum/progress";

export type ActionResult = { ok: boolean; error?: string };

function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok.";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// GÜVENLİK (0038): lesson_progress artık authenticated'a kapalı; yazma yalnız burada,
// service_role ile ve izleme doğrulanarak yapılır. İstemci gerçekten OYNATILARAK izlenen
// süreyi bildirir (accumulateWatched ileri atlamayı saymaz). Tam kanıt değil (aksiyon
// doğrudan da çağrılabilir) ama dümdüz REST forge yolunu kapatır ve süreye göre makul
// olmayan değerleri eler. positionRatio bilgi amaçlı iletilir, kapı değildir, manuel
// "İzledim" düğmesi videoyu sonuna kadar izlemeyi gerektirmez, %20'yi yeterli sayar.
export async function markLessonComplete(
  lessonId: string,
  watchedSeconds = 0,
  _positionRatio = 0,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const uid = await actorId(supabase);
    if (!uid) return { ok: false, error: "Oturum yok." };

    // Süreyi çağıranın client'ıyla oku (RLS "lessons okunur" izin verir).
    const { data: lesson } = await supabase
      .from("lessons")
      .select("sure_sn")
      .eq("id", lessonId)
      .maybeSingle();
    if (!lesson) return { ok: false, error: "Ders bulunamadı." };
    const svc = createServiceClient();

    const dur = (lesson as { sure_sn: number | null }).sure_sn ?? 0;
    const watched = Number.isFinite(watchedSeconds) ? Math.max(0, watchedSeconds) : 0;

    // Süre biliniyorsa: gerçekten oynatılarak izlenen ≥ %20. Bilinmiyorsa: en az 60 sn.
    const enough = dur > 0 ? watched / dur >= WATCHED_THRESHOLD : watched >= 60;
    if (!enough) return { ok: false, error: "Ders henüz yeterince izlenmedi." };

    const now = new Date().toISOString();
    const row = { user_id: uid, lesson_id: lessonId, completed: true, completed_at: now, updated_at: now };

    // 0038 sonrası: service_role ile. 0038 öncesi (grant yok): authenticated client'a düş
    // (o zaman RLS "ilerleme kendi eklenir" hâlâ açıktır ve auth.uid() = user_id tutar).
    const { error: svcErr } = await svc
      .from("lesson_progress")
      .upsert(row, { onConflict: "user_id,lesson_id" });
    if (!svcErr) return { ok: true };

    const { error: authErr } = await supabase
      .from("lesson_progress")
      .upsert(row, { onConflict: "user_id,lesson_id" });
    if (authErr) {
      console.error("markLessonComplete upsert:", { svcErr, authErr });
      return { ok: false, error: "Kaydedilemedi." };
    }
    return { ok: true };
  } catch (e) {
    console.error("markLessonComplete:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}

// ---- DERS SORU-CEVAP ----
export async function addLessonQuestion(lessonId: string, mesaj: string): Promise<ActionResult> {
  try {
    const metin = (mesaj ?? "").trim();
    if (!metin) return { ok: false, error: "Boş mesaj gönderilemez." };
    const supabase = await createClient();
    const uid = await actorId(supabase);
    if (!uid) return { ok: false, error: "Oturum yok." };

    // author_id sunucudan; RLS: author_id = auth.uid() (forge edilemez).
    const { error } = await supabase
      .from("lesson_questions")
      .insert({ lesson_id: lessonId, author_id: uid, mesaj: metin });
    if (error) return { ok: false, error: errMsg(error) };

    // Üye (admin değil) yazdıysa kaptanlara bildir. notifications INSERT politikası
    // is_admin() ister → üye bağlamında service_role ile ekle (best-effort).
    try {
      const { data: amAdmin } = await supabase.rpc("is_admin");
      if (amAdmin !== true) {
        const svc = createServiceClient();
        const [{ data: ders }, { data: admins }] = await Promise.all([
          svc.from("lessons").select("baslik").eq("id", lessonId).single(),
          svc.from("profiles").select("id").eq("role", "admin"),
        ]);
        const baslik = (ders as { baslik: string } | null)?.baslik ?? "bir ders";
        const rows = ((admins ?? []) as { id: string }[]).map((a) => ({
          user_id: a.id,
          mesaj: `"${baslik}" dersinde yeni soru var.`,
          link: `/mufredat/${lessonId}`,
        }));
        if (rows.length > 0) await svc.from("notifications").insert(rows);
      }
    } catch (notifErr) {
      console.error("lesson question notification:", notifErr);
    }

    return { ok: true };
  } catch (e) { console.error("addLessonQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteLessonQuestion(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    // RLS: yazan ya da admin silebilir.
    const { error } = await supabase.from("lesson_questions").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteLessonQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
