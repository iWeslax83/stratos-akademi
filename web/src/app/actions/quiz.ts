"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreQuiz } from "@/lib/quiz/score";
import type { AnswerMap, ScorableQuestion, SubmitResult } from "@/lib/quiz/types";

export async function submitQuiz(
  quizId: string,
  answers: AnswerMap,
): Promise<{ ok: boolean; error?: string; result?: SubmitResult }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { ok: false, error: "Sunucu yapılandırması eksik (servis anahtarı)." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Oturum bulunamadı." };

    const svc = createServiceClient();
    const { data: quiz } = await svc
      .from("quizzes")
      .select("gecme_esigi")
      .eq("id", quizId)
      .single();
    if (!quiz) return { ok: false, error: "Quiz bulunamadı." };

    const { data: questions } = await svc.from("questions").select("id").eq("quiz_id", quizId);
    const qids = (questions ?? []).map((q: { id: string }) => q.id);
    const { data: opts } = qids.length
      ? await svc.from("question_options").select("id,question_id,dogru").in("question_id", qids)
      : { data: [] };

    const correctByQuestion: Record<string, string[]> = {};
    for (const id of qids) correctByQuestion[id] = [];
    for (const o of (opts ?? []) as { id: string; question_id: string; dogru: boolean }[]) {
      if (o.dogru) correctByQuestion[o.question_id].push(o.id);
    }

    const scorable: ScorableQuestion[] = qids.map((id: string) => ({
      id,
      correctOptionIds: correctByQuestion[id],
    }));
    const result = scoreQuiz(scorable, answers, (quiz as { gecme_esigi: number }).gecme_esigi);

    const { error: insertError } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      quiz_id: quizId,
      puan: result.puan,
      gecti: result.gecti,
    });
    if (insertError) {
      console.error("submitQuiz: quiz_attempts insert hatası:", insertError);
      return { ok: false, error: "Sonuç kaydedilemedi." };
    }

    return { ok: true, result: { ...result, correctByQuestion } };
  } catch (e) {
    console.error("submitQuiz beklenmeyen hata:", e);
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}
