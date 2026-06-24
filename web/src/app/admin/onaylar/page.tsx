import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ReviewControls } from "@/components/tasks/ReviewControls";
import { SubmissionThread } from "@/components/tasks/SubmissionThread";
import { getPendingSubmissions, getSubmissionThreads } from "@/lib/tasks/queries";
import { signedUrlMap } from "@/lib/tasks/signed";

export const dynamic = "force-dynamic";

export default async function OnaylarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const pending = await getPendingSubmissions(supabase);
  const urlMap = await signedUrlMap(
    pending.map((s) => s.dosya_yolu).filter((p): p is string => !!p),
  );
  const threads = await getSubmissionThreads(
    supabase,
    pending.map((s) => ({ id: s.id, ownerId: s.userId })),
  );

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Onaylar</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
        Onay Kuyruğu ({pending.length})
      </h1>

      {pending.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Bekleyen gönderim yok.</p>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {pending.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="mb-1 text-xs font-semibold text-gold">
                {s.trackAd} · {s.modulAd}
              </div>
              <div className="font-display font-bold text-navy dark:text-white">{s.taskBaslik}</div>
              <div className="mb-2 text-xs text-muted">{s.uyeEmail}</div>
              <div className="mb-3 rounded-core border border-[var(--line)] p-3 text-sm text-navy dark:text-white">
                {/^https?:\/\//.test(s.icerik) ? (
                  <a href={s.icerik} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-gold underline">
                    {s.icerik}
                  </a>
                ) : (
                  <span className="whitespace-pre-line">{s.icerik}</span>
                )}
              </div>
              {s.dosya_yolu && urlMap.get(s.dosya_yolu) && (
                <a
                  href={urlMap.get(s.dosya_yolu)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 inline-block text-sm font-semibold text-gold underline"
                >
                  Yüklenen dosya →
                </a>
              )}
              <ReviewControls submissionId={s.id} adminId={user!.id} />
              <SubmissionThread
                submissionId={s.id}
                authorId={user!.id}
                comments={threads.get(s.id) ?? []}
              />
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
