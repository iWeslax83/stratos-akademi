import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus } from "./status";
import { attachSubmissionsToTasks, mapPendingRows, type PendingRow } from "./shape";

export type PracticalTask = { id: string; baslik: string; aciklama: string | null; sira: number; puan: number };
export type Submission = {
  id: string;
  icerik: string;
  durum: SubmissionStatus;
  geri_bildirim: string | null;
  dosya_yolu: string | null;
};
export type ModuleTask = { task: PracticalTask; submission: Submission | null };

export async function getModuleTasks(
  supabase: SupabaseClient,
  moduleId: string,
  userId: string | null,
): Promise<ModuleTask[]> {
  const { data: tasks } = await supabase
    .from("practical_tasks")
    .select("id, baslik, aciklama, sira, puan")
    .eq("module_id", moduleId)
    .order("sira");
  const list = (tasks ?? []) as PracticalTask[];
  if (list.length === 0 || !userId) return list.map((t) => ({ task: t, submission: null }));

  const ids = list.map((t) => t.id);
  const { data: subs } = await supabase
    .from("task_submissions")
    .select("id, task_id, icerik, durum, geri_bildirim, dosya_yolu")
    .eq("user_id", userId)
    .in("task_id", ids);

  return attachSubmissionsToTasks(list, (subs ?? []) as (Submission & { task_id: string })[]);
}

export type PendingSubmission = {
  id: string;
  icerik: string;
  dosya_yolu: string | null;
  created_at: string;
  taskBaslik: string;
  modulAd: string;
  trackAd: string;
  uyeEmail: string;
};

export async function getPendingSubmissions(supabase: SupabaseClient): Promise<PendingSubmission[]> {
  const { data } = await supabase
    .from("task_submissions")
    .select("id, icerik, created_at, user_id, dosya_yolu, practical_tasks ( baslik, modules ( ad, tracks ( ad ) ) )")
    .eq("durum", "beklemede")
    .order("created_at");
  const rows = (data ?? []) as unknown as PendingRow[];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of (profs ?? []) as { id: string; email: string }[]) emailById.set(p.id, p.email);
  }

  return mapPendingRows(rows, emailById);
}
