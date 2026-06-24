import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatRing } from "@/components/dashboard/StatRing";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { DisplayNameEditor } from "@/components/profile/DisplayNameEditor";
import { PointsBreakdown } from "@/components/dashboard/PointsBreakdown";
import { pointsBreakdown } from "@/lib/dashboard/points";
import { badgeProgress, nextBadge } from "@/lib/badges/compute";
import { getCurriculum } from "@/lib/curriculum/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildStats } from "@/lib/dashboard/stats";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Bağımsız sorgular eşzamanlı (sayfa gecikmesini azaltır).
  const [{ data: profile }, curriculum, dash, { count: onayliGorev }, leaderboard] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
    supabase
      .from("task_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("durum", "onay"),
    getLeaderboard(supabase),
  ]);
  const ad = profile?.ad ?? profile?.email ?? "Üye";
  const initial = ad.charAt(0).toUpperCase();
  const isAdmin = profile?.role === "admin";

  const { completedIds, bestQuizScores, activityDates, approvedTaskPoints } = dash;
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    activityDates,
    today: new Date(),
    approvedTaskPoints,
  });

  const rank = leaderboard.find((r) => r.userId === user!.id)?.sira ?? null;

  const badgeStats = {
    lessons: stats.completedCount,
    tasks: onayliGorev ?? 0,
    competencies: stats.earnedCompetencies.length,
    points: stats.points,
    streak: stats.streak,
    quizPerfect: stats.bestQuizScores.filter((s) => s >= 100).length,
  };
  const badgeItems = badgeProgress(badgeStats, "full");
  const nextRozet = nextBadge(badgeStats, "full");
  const puanDagilimi = pointsBreakdown(stats.completedCount, stats.bestQuizScores, approvedTaskPoints);

  return (
    <AppShell initial={initial} isAdmin={isAdmin} streak={stats.streak} points={stats.points}>
      <Eyebrow>Profil</Eyebrow>
      <div className="mb-6 mt-3 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-navy text-2xl font-bold text-white dark:bg-gold dark:text-navy">
          {initial}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">{ad}</h1>
          <p className="text-sm text-muted">
            {profile?.email}
            {isAdmin && " · Kaptan"}
          </p>
          <div className="mt-1.5">
            <DisplayNameEditor userId={user!.id} current={profile?.ad ?? ""} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-4">
        <Card>
          <StatRing pct={stats.overall.pct} label="İlerleme" />
        </Card>
        <Card>
          <StatCard value={stats.points} label="Puan" gold />
        </Card>
        <Card>
          <StatCard value={stats.streak} label="Günlük seri" />
        </Card>
        <Card>
          <StatCard value={onayliGorev ?? 0} label="Onaylı görev" />
        </Card>
      </div>

      <Card className="mt-[18px]">
        <CompetencyShelf
          tracks={stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }))}
          earned={stats.earnedCompetencies}
          rank={rank}
        />
      </Card>

      <Card className="mt-[18px]">
        <PointsBreakdown data={puanDagilimi} />
      </Card>

      <Card className="mt-[18px]">
        <BadgeShelf items={badgeItems} next={nextRozet} />
      </Card>
    </AppShell>
  );
}
