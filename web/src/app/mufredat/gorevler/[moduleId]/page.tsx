import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SubmissionForm } from "@/components/tasks/SubmissionForm";
import { SubmissionThread } from "@/components/tasks/SubmissionThread";
import { getModuleTasks, getSubmissionThreads } from "@/lib/tasks/queries";
import type { ThreadItem } from "@/lib/tasks/comment";
import { signedUrlMap } from "@/lib/tasks/signed";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function UyeGorevlerPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: modul } = await supabase
    .from("modules")
    .select("id, ad, track_id, tracks(ad)")
    .eq("id", moduleId)
    .single();
  if (!modul) notFound();

  const tasks = await getModuleTasks(supabase, moduleId, user?.id ?? null);
  const dosyaYollari = tasks
    .map((t) => t.submission?.dosya_yolu)
    .filter((p): p is string => !!p);
  const urlMap = await signedUrlMap(dosyaYollari);
  const threads = user
    ? await getSubmissionThreads(
        supabase,
        tasks
          .filter((t) => t.submission)
          .map((t) => ({ id: t.submission!.id, ownerId: user.id })),
      )
    : new Map<string, ThreadItem[]>();
  const isAdmin = await isAdminUser(supabase, user?.id);
  const tracksRaw = (modul as unknown as { tracks: { ad: string } | { ad: string }[] | null }).tracks;
  const trackAd = Array.isArray(tracksRaw) ? (tracksRaw[0]?.ad ?? "") : (tracksRaw?.ad ?? "");

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()} isAdmin={isAdmin}>
      <div className="mb-4">
        <Eyebrow>{trackAd} · {modul.ad}</Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          Pratik Görevler
        </h1>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted">Bu modülde pratik görev yok.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(({ task, submission }) => (
            <Card key={task.id} className="p-5">
              <h3 className="font-display text-lg font-bold text-navy dark:text-white">{task.baslik}</h3>
              <div className="mt-1 text-xs font-semibold text-accent-ink dark:text-accent">{task.puan} puan</div>
              {task.aciklama && (
                <p className="mt-1 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">
                  {task.aciklama}
                </p>
              )}
              {user && (
                <SubmissionForm
                  taskId={task.id}
                  userId={user.id}
                  submission={submission}
                  dosyaUrl={submission?.dosya_yolu ? (urlMap.get(submission.dosya_yolu) ?? null) : null}
                />
              )}
              {user && submission && (
                <SubmissionThread
                  submissionId={submission.id}
                  authorId={user.id}
                  comments={threads.get(submission.id) ?? []}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
