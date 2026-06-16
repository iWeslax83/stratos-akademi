import type { SupabaseClient } from "@supabase/supabase-js";

// Dashboard için kullanıcıya özel ham veriyi okur:
// tamamlanan ders id'leri, quiz başına en iyi puan, ve tüm aktivite tarihleri (streak için).
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ completedIds: Set<string>; bestQuizScores: number[]; activityDates: Date[] }> {
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
  const best = new Map<string, number>();
  for (const a of (attempts ?? []) as { quiz_id: string; puan: number }[]) {
    best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? 0, a.puan));
  }
  const bestQuizScores = [...best.values()];

  // Aktivite tarihleri = ders tamamlama + quiz denemeleri
  const activityDates: Date[] = [];
  for (const r of (prog ?? []) as { completed_at: string | null }[]) {
    if (r.completed_at) activityDates.push(new Date(r.completed_at));
  }
  for (const a of (attempts ?? []) as { created_at: string }[]) {
    if (a.created_at) activityDates.push(new Date(a.created_at));
  }

  return { completedIds, bestQuizScores, activityDates };
}
