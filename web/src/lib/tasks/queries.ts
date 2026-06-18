import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus } from "./status";

export type PracticalTask = { id: string; baslik: string; aciklama: string | null; sira: number };
export type Submission = {
  id: string;
  icerik: string;
  durum: SubmissionStatus;
  geri_bildirim: string | null;
};
export type ModuleTask = { task: PracticalTask; submission: Submission | null };

export async function getModuleTasks(
  supabase: SupabaseClient,
  moduleId: string,
  userId: string | null,
): Promise<ModuleTask[]> {
  const { data: tasks } = await supabase
    .from("practical_tasks")
    .select("id, baslik, aciklama, sira")
    .eq("module_id", moduleId)
    .order("sira");
  const list = (tasks ?? []) as PracticalTask[];
  if (list.length === 0 || !userId) return list.map((t) => ({ task: t, submission: null }));

  const ids = list.map((t) => t.id);
  const { data: subs } = await supabase
    .from("task_submissions")
    .select("id, task_id, icerik, durum, geri_bildirim")
    .eq("user_id", userId)
    .in("task_id", ids);

  const byTask = new Map<string, Submission>();
  for (const s of (subs ?? []) as (Submission & { task_id: string })[]) {
    const { task_id, ...rest } = s;
    byTask.set(task_id, rest);
  }
  return list.map((t) => ({ task: t, submission: byTask.get(t.id) ?? null }));
}

export type PendingSubmission = {
  id: string;
  icerik: string;
  created_at: string;
  taskBaslik: string;
  modulAd: string;
  trackAd: string;
  uyeEmail: string;
};

type PendingRow = {
  id: string;
  icerik: string;
  created_at: string;
  user_id: string;
  practical_tasks: {
    baslik: string;
    modules: { ad: string; tracks: { ad: string } | null } | null;
  } | null;
};

export async function getPendingSubmissions(supabase: SupabaseClient): Promise<PendingSubmission[]> {
  const { data } = await supabase
    .from("task_submissions")
    .select("id, icerik, created_at, user_id, practical_tasks ( baslik, modules ( ad, tracks ( ad ) ) )")
    .eq("durum", "beklemede")
    .order("created_at");
  const rows = (data ?? []) as unknown as PendingRow[];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of (profs ?? []) as { id: string; email: string }[]) emailById.set(p.id, p.email);
  }

  return rows.map((r) => ({
    id: r.id,
    icerik: r.icerik,
    created_at: r.created_at,
    taskBaslik: r.practical_tasks?.baslik ?? "(görev)",
    modulAd: r.practical_tasks?.modules?.ad ?? "",
    trackAd: r.practical_tasks?.modules?.tracks?.ad ?? "",
    uyeEmail: emailById.get(r.user_id) ?? "(üye)",
  }));
}
