import { createServiceClient } from "@/lib/supabase/service";

export type AdminOption = { id: string; metin: string; dogru: boolean; sira: number };
export type AdminQuestion = {
  id: string;
  metin: string;
  sira: number;
  aciklama: string | null;
  options: AdminOption[];
};
export type AdminQuiz = { id: string; baslik: string; gecme_esigi: number; questions: AdminQuestion[] };

// Modülün quiz'ini doğru cevaplar DAHİL (service_role) okur. Quiz yoksa null.
// service_role anahtarı yoksa hata fırlatır (çağıran sayfa yakalar).
export async function getQuizForAdmin(moduleId: string): Promise<AdminQuiz | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Servis anahtarı eksik (SUPABASE_SERVICE_ROLE_KEY).");
  }
  const svc = createServiceClient();

  const { data: quiz } = await svc
    .from("quizzes")
    .select("id, baslik, gecme_esigi")
    .eq("module_id", moduleId)
    .maybeSingle();
  if (!quiz) return null;

  const { data: questions } = await svc
    .from("questions")
    .select("id, metin, sira")
    .eq("quiz_id", quiz.id)
    .order("sira");
  const qids = (questions ?? []).map((q: { id: string }) => q.id);

  // Açıklamalar best-effort (aciklama kolonu yoksa boş; editör yine çalışır).
  const aciklamaById = new Map<string, string | null>();
  if (qids.length) {
    const { data: ar } = await svc.from("questions").select("id, aciklama").in("id", qids);
    for (const q of (ar ?? []) as { id: string; aciklama: string | null }[]) {
      aciklamaById.set(q.id, q.aciklama);
    }
  }

  const { data: opts } = qids.length
    ? await svc
        .from("question_options")
        .select("id, question_id, metin, dogru, sira")
        .in("question_id", qids)
        .order("sira")
    : { data: [] };

  const byQuestion = new Map<string, AdminOption[]>();
  for (const o of (opts ?? []) as (AdminOption & { question_id: string })[]) {
    const { question_id, ...rest } = o;
    const arr = byQuestion.get(question_id) ?? [];
    arr.push(rest);
    byQuestion.set(question_id, arr);
  }

  return {
    id: quiz.id,
    baslik: quiz.baslik,
    gecme_esigi: quiz.gecme_esigi,
    questions: (questions ?? []).map((q: { id: string; metin: string; sira: number }) => ({
      ...q,
      aciklama: aciklamaById.get(q.id) ?? null,
      options: byQuestion.get(q.id) ?? [],
    })),
  };
}
