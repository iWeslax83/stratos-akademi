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
import { badgeStatsFromDashboard } from "@/lib/badges/stats";
import { getCurriculum } from "@/lib/curriculum/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildStats } from "@/lib/dashboard/stats";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";
import { getApprovedTaskCount } from "@/lib/tasks/queries";
import { earnedCertificates } from "@/lib/certificate/eligibility";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Bağımsız sorgular eşzamanlı (sayfa gecikmesini azaltır).
  const [{ data: profile }, curriculum, dash, onayliGorev, leaderboard] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
    getApprovedTaskCount(supabase, user!.id),
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

  const badgeStats = badgeStatsFromDashboard(stats, onayliGorev);
  const badgeItems = badgeProgress(badgeStats, "full");
  const nextRozet = nextBadge(badgeStats, "full");
  const puanDagilimi = pointsBreakdown(stats.completedCount, stats.bestQuizScores, approvedTaskPoints);
  const sertifikalar = earnedCertificates(
    stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon })),
    stats.earnedCompetencies,
  );

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

      {sertifikalar.length > 0 && (
        <Card className="mt-[18px] p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-navy dark:text-white">Sertifikalar</h2>
          <p className="mb-3 text-sm text-muted">Tamamladığın dallar için katılım belgesi.</p>
          <div className="flex flex-wrap gap-2">
            {sertifikalar.map((s) => (
              <Link
                key={s.slug}
                href={`/sertifika/${s.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-soft dark:text-white dark:hover:bg-gold-dark"
              >
                <span>{s.ikon}</span> {s.ad} belgesi →
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-[18px]">
        <PointsBreakdown data={puanDagilimi} />
      </Card>

      <Card className="mt-[18px]">
        <BadgeShelf items={badgeItems} next={nextRozet} />
      </Card>
    </AppShell>
  );
}
