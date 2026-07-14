import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { CurriculumBrowser } from "@/components/curriculum/CurriculumBrowser";
import { Reveal } from "@/components/ui/Reveal";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { computeStatuses, overallProgress } from "@/lib/curriculum/progress";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function MufredatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curriculum = await getCurriculum(supabase);
  const completed = user ? await getCompletedLessonIds(supabase, user.id) : new Set<string>();
  const statuses = computeStatuses(curriculum, completed);
  const progress = overallProgress(curriculum, completed);
  const isAdmin = await isAdminUser(supabase, user?.id);

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()} isAdmin={isAdmin}>
      <Reveal className="mb-4">
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Öğrenme yolun
        </h1>
        <p className="mt-1.5 text-muted">
          {progress.done}/{progress.total} ders tamamlandı · %{progress.pct}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <Card className="p-5">
          {curriculum.length === 0 ? (
            <p className="text-sm text-muted">Henüz içerik eklenmedi.</p>
          ) : (
            <CurriculumBrowser curriculum={curriculum} statuses={Object.fromEntries(statuses)} />
          )}
        </Card>
      </Reveal>
    </AppShell>
  );
}
