import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatRing } from "@/components/dashboard/StatRing";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email, role")
    .eq("id", user!.id)
    .single();
  const ad = profile?.ad ?? profile?.email ?? "Üye";
  const initial = ad.charAt(0).toUpperCase();
  const isAdmin = profile?.role === "admin";

  const curriculum = await getCurriculum(supabase);
  const { completedIds, bestQuizScores, activityDates, approvedTaskPoints } = await getDashboardData(
    supabase,
    user!.id,
  );
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    activityDates,
    today: new Date(),
    approvedTaskPoints,
  });

  const { count: onayliGorev } = await supabase
    .from("task_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("durum", "onay");

  const leaderboard = await getLeaderboard(supabase);
  const rank = leaderboard.find((r) => r.userId === user!.id)?.sira ?? null;

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
    </AppShell>
  );
}
