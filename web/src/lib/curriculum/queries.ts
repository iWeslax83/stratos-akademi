import type { SupabaseClient } from "@supabase/supabase-js";
import type { Curriculum, Lesson, Module, Track } from "./types";

type TrackRow = Omit<Track, "modules">;
type ModuleRow = Omit<Module, "lessons" | "quiz"> & { track_id: string };
type LessonRow = Lesson & { module_id: string };

export async function getCurriculum(supabase: SupabaseClient): Promise<Curriculum> {
  const [{ data: tracks }, { data: modules }, { data: lessons }, { data: quizzes }] =
    await Promise.all([
      supabase.from("tracks").select("id,slug,ad,aciklama,ikon,sira").order("sira"),
      supabase.from("modules").select("id,track_id,ad,aciklama,sira").order("sira"),
      supabase
        .from("lessons")
        .select("id,module_id,baslik,youtube_video_id,aciklama,sure_sn,sira")
        .order("sira"),
      supabase.from("quizzes").select("id,module_id,baslik"),
    ]);

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const row of (lessons ?? []) as LessonRow[]) {
    const { module_id, ...lesson } = row;
    const arr = lessonsByModule.get(module_id) ?? [];
    arr.push(lesson);
    lessonsByModule.set(module_id, arr);
  }

  const quizByModule = new Map<string, { id: string; baslik: string }>();
  for (const row of (quizzes ?? []) as { id: string; module_id: string; baslik: string }[]) {
    quizByModule.set(row.module_id, { id: row.id, baslik: row.baslik });
  }

  const modulesByTrack = new Map<string, Module[]>();
  for (const row of (modules ?? []) as ModuleRow[]) {
    const { track_id, ...rest } = row;
    const module: Module = {
      ...rest,
      quiz: quizByModule.get(rest.id) ?? null,
      lessons: lessonsByModule.get(rest.id) ?? [],
    };
    const arr = modulesByTrack.get(track_id) ?? [];
    arr.push(module);
    modulesByTrack.set(track_id, arr);
  }

  return ((tracks ?? []) as TrackRow[]).map((t) => ({
    ...t,
    modules: modulesByTrack.get(t.id) ?? [],
  }));
}

export async function getCompletedLessonIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true);
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id));
}
