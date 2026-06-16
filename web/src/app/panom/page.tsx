import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatRing } from "@/components/dashboard/StatRing";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { TrackList } from "@/components/dashboard/TrackList";
import { getCurriculum } from "@/lib/curriculum/queries";
import { flatten, resumeLessonId, moduleProgress } from "@/lib/curriculum/progress";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildStats } from "@/lib/dashboard/stats";
import { LeaderboardMini } from "@/components/dashboard/LeaderboardMini";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { CompetencyToast } from "@/components/dashboard/CompetencyToast";
import { syncCompetencies } from "@/app/actions/competencies";

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
  const { completedIds, bestQuizScores, activityDates } = await getDashboardData(supabase, user!.id);
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    activityDates,
    today: new Date(),
  });

  const leaderboard = await getLeaderboard(supabase);

  const { yeni } = await syncCompetencies(user!.id, stats.earnedCompetencies);
  const myRank = leaderboard.find((r) => r.userId === user!.id)?.sira ?? null;
  const trackBySlug = new Map(stats.perTrack.map((t) => [t.slug, t.ad]));
  const yeniAdlar = yeni.map((s) => trackBySlug.get(s) ?? s);

  // Kaldığın yer + modül ilerlemesi
  const resumeId = resumeLessonId(curriculum, completedIds);
  const resume = resumeId ? flatten(curriculum).find((f) => f.lesson.id === resumeId) ?? null : null;
  const modProg = resume ? moduleProgress(resume.module, completedIds) : null;
  const kalanDk = modProg ? Math.ceil(modProg.kalanSure_sn / 60) : 0;
  const allDone = curriculum.length > 0 && resume === null;

  return (
    <AppShell initial={initial} streak={stats.streak} points={stats.points}>
      <div className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad} 👋
        </h1>
        <p className="mt-1.5 text-muted">
          Toplam ilerleme: {stats.overall.done}/{stats.overall.total} ders · %{stats.overall.pct}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <ResumeCard
            resume={resume}
            modulePct={modProg?.pct ?? 0}
            kalanDk={kalanDk}
            allDone={allDone}
          />
        </Card>

        <div className="grid grid-cols-2 gap-[18px] lg:col-span-5">
          <Card>
            <StatRing pct={stats.overall.pct} label="Toplam ilerleme" />
          </Card>
          <Card>
            <StatCard icon="🔥" value={stats.streak} label="Günlük seri (gün)" />
          </Card>
          <Card className="col-span-2">
            <CompetencyShelf
              tracks={stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }))}
              earned={stats.earnedCompetencies}
              rank={myRank}
            />
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <TrackList tracks={stats.perTrack} />
        </Card>

        <Card className="lg:col-span-5">
          <LeaderboardMini rows={leaderboard} meUserId={user!.id} />
        </Card>
      </div>
      <CompetencyToast adlar={yeniAdlar} />
    </AppShell>
  );
}
