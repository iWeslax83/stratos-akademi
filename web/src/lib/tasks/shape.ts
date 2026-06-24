import type { ModuleTask, PracticalTask, Submission, PendingSubmission } from "./queries";

// Üyenin gönderimlerini görevlere bağlar (task_id çıkarılır). getModuleTasks'tan ayrıştırıldı.
export function attachSubmissionsToTasks(
  tasks: PracticalTask[],
  subs: (Submission & { task_id: string })[],
): ModuleTask[] {
  const byTask = new Map<string, Submission>();
  for (const s of subs) {
    const { task_id, ...rest } = s;
    byTask.set(task_id, rest);
  }
  return tasks.map((t) => ({ task: t, submission: byTask.get(t.id) ?? null }));
}

// Onay kuyruğu satırının iç içe join şekli (practical_tasks → modules → tracks).
export type PendingRow = {
  id: string;
  icerik: string;
  created_at: string;
  user_id: string;
  dosya_yolu: string | null;
  practical_tasks: {
    baslik: string;
    modules: { ad: string; tracks: { ad: string } | null } | null;
  } | null;
};

// İç içe join satırlarını düz PendingSubmission'a indirger; eksik alanlara güvenli fallback.
export function mapPendingRows(
  rows: PendingRow[],
  emailById: Map<string, string>,
): PendingSubmission[] {
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    icerik: r.icerik,
    dosya_yolu: r.dosya_yolu,
    created_at: r.created_at,
    taskBaslik: r.practical_tasks?.baslik ?? "(görev)",
    modulAd: r.practical_tasks?.modules?.ad ?? "",
    trackAd: r.practical_tasks?.modules?.tracks?.ad ?? "",
    uyeEmail: emailById.get(r.user_id) ?? "(üye)",
  }));
}
