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
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- QUIZ ----
export async function createQuiz(moduleId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quizzes")
      .insert({ module_id: moduleId, baslik: "Modül Quizi", gecme_esigi: 70, sira: 0 });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Bu modülde zaten bir quiz var." };
      return { ok: false, error: errMsg(error) };
    }
    return { ok: true };
  } catch (e) { console.error("createQuiz:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateQuizMeta(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const esik = Math.max(0, Math.min(100, intOr(fd, "gecme_esigi", 70)));
    const supabase = await createClient();
    const { error } = await supabase.from("quizzes").update({ baslik, gecme_esigi: esik }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateQuizMeta:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteQuiz:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- QUESTION ----
export async function createQuestion(quizId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("questions").insert({ quiz_id: quizId, metin: "", sira: 0 });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateQuestion(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const metin = str(fd, "metin");
    if (!id) return { ok: false, error: "id eksik." };
    if (!metin) return { ok: false, error: "Soru metni zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("questions")
      .update({ metin, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- OPTION ----
export async function createOption(questionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("question_options")
      .insert({ question_id: questionId, metin: "", dogru: false, sira: 0 });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateOption(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const metin = str(fd, "metin");
    if (!id) return { ok: false, error: "id eksik." };
    if (!metin) return { ok: false, error: "Şık metni zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("question_options")
      .update({ metin, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function toggleOption(id: string, dogru: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("question_options").update({ dogru }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("toggleOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteOption(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("question_options").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
