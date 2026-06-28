import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus } from "./status";
import { attachSubmissionsToTasks, mapPendingRows, type PendingRow } from "./shape";
import { groupThreads, type CommentRow, type ThreadItem } from "./comment";

export type PracticalTask = { id: string; baslik: string; aciklama: string | null; sira: number; puan: number };
export type Submission = {
  id: string;
  icerik: string;
  durum: SubmissionStatus;
  geri_bildirim: string | null;
  dosya_yolu: string | null;
};
export type ModuleTask = { task: PracticalTask; submission: Submission | null };

// Üyenin onaylanmış pratik görev sayısı (profil/dashboard için).
export async function getApprovedTaskCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("task_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("durum", "onay");
  return count ?? 0;
}

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
  userId: string;
  icerik: string;
  dosya_yolu: string | null;
  created_at: string;
  taskBaslik: string;
  modulAd: string;
  trackAd: string;
  uyeEmail: string;
};

// Verilen gönderimler için yorum dizilerini toplu çeker (üye sayfası + onay kuyruğu).
// `submissions`: her gönderimin id'si ve sahibi (üye user_id) — sahiplik etiketi için.
export async function getSubmissionThreads(
  supabase: SupabaseClient,
  submissions: { id: string; ownerId: string }[],
): Promise<Map<string, ThreadItem[]>> {
  if (submissions.length === 0) return new Map();
  const ids = submissions.map((s) => s.id);
  const { data } = await supabase
    .from("submission_comments")
    .select("id, submission_id, author_id, mesaj, created_at")
    .in("submission_id", ids)
    .order("created_at");
  const rows = (data ?? []) as CommentRow[];

  const ownerById = new Map(submissions.map((s) => [s.id, s.ownerId]));
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const nameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, ad").in("id", authorIds);
    for (const p of (profs ?? []) as { id: string; ad: string | null }[]) {
      if (p.ad) nameById.set(p.id, p.ad);
    }
  }
  return groupThreads(rows, ownerById, nameById);
}

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
