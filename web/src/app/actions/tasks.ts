"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok.";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- ÜYE GÖNDERİMİ ----
export async function submitTask(
  taskId: string,
  icerik: string,
  userId: string,
): Promise<ActionResult> {
  try {
    const metin = (icerik ?? "").trim();
    if (!metin) return { ok: false, error: "İçerik boş olamaz." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("task_submissions")
      .upsert(
        {
          user_id: userId,
          task_id: taskId,
          icerik: metin,
          durum: "beklemede",
          geri_bildirim: null,
          reviewed_by: null,
          reviewed_at: null,
        },
        { onConflict: "user_id,task_id" },
      );
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("submitTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN GÖREV TANIMI CRUD ----
export async function createTask(fd: FormData): Promise<ActionResult> {
  try {
    const moduleId = str(fd, "module_id");
    const baslik = str(fd, "baslik");
    if (!moduleId) return { ok: false, error: "module_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").insert({
      module_id: moduleId,
      baslik,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateTask(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("practical_tasks")
      .update({ baslik, aciklama: str(fd, "aciklama") || null, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN İNCELEME ----
export async function reviewSubmission(
  id: string,
  durum: "onay" | "red",
  geriBildirim: string,
  adminId: string,
): Promise<ActionResult> {
  try {
    const fb = (geriBildirim ?? "").trim();
    if (durum === "red" && !fb) return { ok: false, error: "Reddederken bir not gir." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("task_submissions")
      .update({
        durum,
        geri_bildirim: fb || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("reviewSubmission:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
