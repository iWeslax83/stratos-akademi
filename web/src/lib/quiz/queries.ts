import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quiz, QuizOption } from "./types";
import { groupOptionsByQuestion } from "./group";
import type { AttemptRow } from "./history";

export async function getQuiz(supabase: SupabaseClient, quizId: string): Promise<Quiz | null> {
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id,module_id,baslik,gecme_esigi")
    .eq("id", quizId)
    .single();
  if (!quiz) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id,metin,sira")
    .eq("quiz_id", quizId)
    .order("sira");

  const qids = (questions ?? []).map((q: { id: string }) => q.id);
  const { data: options } = qids.length
    ? await supabase
        .from("question_options")
        .select("id,question_id,metin,sira")
        .in("question_id", qids)
        .order("sira")
    : { data: [] };

  const builtQuestions = groupOptionsByQuestion(
    (questions ?? []) as { id: string; metin: string; sira: number }[],
    (options ?? []) as (QuizOption & { question_id: string })[],
  );

  return { ...(quiz as Omit<Quiz, "questions">), questions: builtQuestions };
}

export async function getBestScore(
  supabase: SupabaseClient,
  userId: string,
  quizId: string,
): Promise<{ puan: number; gecti: boolean } | null> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("puan,gecti")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("puan", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { puan: number; gecti: boolean } | null) ?? null;
}

// Üyenin bu quizdeki tüm denemeleri (en yeniden eskiye). RLS: yalnız kendi satırları.
export async function getAttemptHistory(
  supabase: SupabaseClient,
  userId: string,
  quizId: string,
): Promise<AttemptRow[]> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("puan,gecti,created_at")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });
  return (data as AttemptRow[] | null) ?? [];
}
