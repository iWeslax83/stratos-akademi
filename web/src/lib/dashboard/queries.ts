import type { SupabaseClient } from "@supabase/supabase-js";
import { bestScoresPerQuiz, sumApprovedTaskPoints, type ApprovedTaskRow } from "./aggregate";

// Dashboard için kullanıcıya özel ham veriyi okur:
// tamamlanan ders id'leri, quiz başına en iyi puan, ve tüm aktivite tarihleri (aktivite takvimi için).
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ completedIds: Set<string>; bestQuizScores: number[]; activityDates: Date[]; approvedTaskPoints: number }> {
  const [{ data: prog }, { data: attempts }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase.from("quiz_attempts").select("quiz_id, puan, created_at").eq("user_id", userId),
  ]);

  const completedIds = new Set(
    (prog ?? []).map((r: { lesson_id: string }) => r.lesson_id),
  );

  // Quiz başına en iyi puan
  const bestQuizScores = bestScoresPerQuiz((attempts ?? []) as { quiz_id: string; puan: number }[]);

  // Aktivite tarihleri = ders tamamlama + quiz denemeleri
  const activityDates: Date[] = [];
  for (const r of (prog ?? []) as { completed_at: string | null }[]) {
    if (r.completed_at) activityDates.push(new Date(r.completed_at));
  }
  for (const a of (attempts ?? []) as { created_at: string }[]) {
    if (a.created_at) activityDates.push(new Date(a.created_at));
  }

  const { data: approved } = await supabase
    .from("task_submissions")
    .select("practical_tasks(puan)")
    .eq("user_id", userId)
    .eq("durum", "onay");
  const approvedTaskPoints = sumApprovedTaskPoints((approved ?? []) as unknown as ApprovedTaskRow[]);

  return { completedIds, bestQuizScores, activityDates, approvedTaskPoints };
}
