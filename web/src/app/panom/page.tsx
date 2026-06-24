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
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { Toast } from "@/components/dashboard/Toast";
import { badgeProgress, nextBadge, computeBadges } from "@/lib/badges/compute";
import { badgeStatsFromDashboard } from "@/lib/badges/stats";
import { badgeNames } from "@/lib/badges/catalog";
import { syncBadges } from "@/app/actions/badges";
import { getApprovedTaskCount } from "@/lib/tasks/queries";
import { syncCompetencies } from "@/app/actions/competencies";

export const dynamic = "force-dynamic";

export default async function PanomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bağımsız sorgular eşzamanlı (dashboard gecikmesini azaltır).
  const [{ data: profile }, curriculum, dash, leaderboard, onayliGorev] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
    getLeaderboard(supabase),
    getApprovedTaskCount(supabase, user!.id),
  ]);
  const ad = profile?.ad ?? profile?.email ?? "üye";
  const isAdmin = profile?.role === "admin";
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const { completedIds, bestQuizScores, activityDates, approvedTaskPoints } = dash;
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    activityDates,
    today: new Date(),
    approvedTaskPoints,
  });

  const badgeStats = badgeStatsFromDashboard(stats, onayliGorev);
  const badgeItems = badgeProgress(badgeStats, "full");
  const nextRozet = nextBadge(badgeStats, "full");
  const earnedBadgeIds = [...computeBadges(badgeStats)];
  const [{ yeni: yeniRozet }, { yeni }] = await Promise.all([
    syncBadges(user!.id, earnedBadgeIds),
    syncCompetencies(user!.id, stats.earnedCompetencies),
  ]);
  const yeniRozetAdlar = badgeNames(yeniRozet);
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
    <AppShell initial={initial} streak={stats.streak} points={stats.points} isAdmin={isAdmin}>
      <div className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad}
        </h1>
        <p className="mt-1.5 text-muted">
          Toplam ilerleme: {stats.overall.done}/{stats.overall.total} ders · %{stats.overall.pct}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-12">
        <Card outerClassName="h-full lg:col-span-7" className="h-full">
          <ResumeCard
            resume={resume}
            modulePct={modProg?.pct ?? 0}
            kalanDk={kalanDk}
            allDone={allDone}
          />
        </Card>

        <div className="grid grid-cols-2 gap-[18px] lg:col-span-5">
          <Card outerClassName="h-full" className="h-full">
            <StatRing pct={stats.overall.pct} label="Toplam ilerleme" />
          </Card>
          <Card outerClassName="h-full" className="h-full">
            <StatCard value={stats.streak} label="Günlük seri (gün)" />
          </Card>
          <Card outerClassName="col-span-2">
            <CompetencyShelf
              tracks={stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }))}
              earned={stats.earnedCompetencies}
              rank={myRank}
            />
          </Card>
        </div>

        <Card outerClassName="lg:col-span-7">
          <TrackList tracks={stats.perTrack} />
        </Card>

        <Card outerClassName="lg:col-span-5">
          <LeaderboardMini rows={leaderboard} meUserId={user!.id} />
        </Card>

        <Card outerClassName="lg:col-span-12">
          <BadgeShelf items={badgeItems} next={nextRozet} />
        </Card>
      </div>
      <Toast baslik="Yeni yetkinlik" adlar={yeniAdlar} />
      <Toast baslik={yeniRozetAdlar.length > 1 ? "Yeni rozetler" : "Yeni rozet"} adlar={yeniRozetAdlar} />
    </AppShell>
  );
}
