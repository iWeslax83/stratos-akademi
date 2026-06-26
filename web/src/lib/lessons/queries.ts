import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLessonThread, type QaItem, type QaRow } from "./qa";

// Bir dersin soru-cevap thread'i (yazar adı + admin etiketiyle, created_at artan).
export async function getLessonThread(supabase: SupabaseClient, lessonId: string): Promise<QaItem[]> {
  const { data } = await supabase
    .from("lesson_questions")
    .select("id, lesson_id, author_id, mesaj, created_at")
    .eq("lesson_id", lessonId)
    .order("created_at");
  const rows = (data ?? []) as QaRow[];

  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const nameById = new Map<string, string>();
  const adminIds = new Set<string>();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, ad, role").in("id", authorIds);
    for (const p of (profs ?? []) as { id: string; ad: string | null; role: string }[]) {
      if (p.ad) nameById.set(p.id, p.ad);
      if (p.role === "admin") adminIds.add(p.id);
    }
  }
  return buildLessonThread(rows, nameById, adminIds);
}
