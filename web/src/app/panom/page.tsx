import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { flatten, resumeLessonId, overallProgress } from "@/lib/curriculum/progress";

export const dynamic = "force-dynamic";

export default async function PanomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();

  const ad = profile?.ad ?? profile?.email ?? "üye";
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const curriculum = await getCurriculum(supabase);
  const completed = await getCompletedLessonIds(supabase, user!.id);
  const progress = overallProgress(curriculum, completed);
  const resumeId = resumeLessonId(curriculum, completed);
  const resume = resumeId ? flatten(curriculum).find((f) => f.lesson.id === resumeId) : null;

  return (
    <AppShell initial={initial}>
      <div className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad} 👋
        </h1>
        <p className="mt-1.5 text-muted">
          Toplam ilerleme: {progress.done}/{progress.total} ders · %{progress.pct}
        </p>
      </div>

      <Card className="p-6">
        {resume ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
                Kaldığın yerden · {resume.track.ad}
              </span>
              <h3 className="mt-1 font-display text-xl font-bold text-navy dark:text-white">
                {resume.lesson.baslik}
              </h3>
            </div>
            <Link href={`/mufredat/${resume.lesson.id}`}>
              <Button variant="primary" icon="→">
                Devam et
              </Button>
            </Link>
          </div>
        ) : curriculum.length === 0 ? (
          <p className="text-sm text-muted">Müfredat yakında eklenecek.</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              🎉 Tüm dersleri tamamladın!
            </p>
            <Link href="/mufredat">
              <Button variant="ghost">Müfredatı gör</Button>
            </Link>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
