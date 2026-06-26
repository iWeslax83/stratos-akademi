"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type ActionResult = { ok: boolean; error?: string };

function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok.";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

export async function markLessonComplete(lessonId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  return { ok: !error };
}

// ---- DERS SORU-CEVAP ----
export async function addLessonQuestion(
  lessonId: string,
  mesaj: string,
  authorId: string,
): Promise<ActionResult> {
  try {
    const metin = (mesaj ?? "").trim();
    if (!metin) return { ok: false, error: "Boş mesaj gönderilemez." };
    const supabase = await createClient();

    // RLS: author_id = auth.uid() (forge edilemez).
    const { error } = await supabase
      .from("lesson_questions")
      .insert({ lesson_id: lessonId, author_id: authorId, mesaj: metin });
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
