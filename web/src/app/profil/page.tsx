import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { StatRing } from "@/components/dashboard/StatRing";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
import { Reveal } from "@/components/ui/Reveal";
import { Avatar } from "@/components/ui/Avatar";
import { getTeamPhotos, photoFor } from "@/lib/team/photos";
import { PointsBreakdown } from "@/components/dashboard/PointsBreakdown";
import { pointsBreakdown } from "@/lib/dashboard/points";
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
  const [{ data: profile }, curriculum, dash, onayliGorev, leaderboard, photos] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
    getApprovedTaskCount(supabase, user!.id),
    getLeaderboard(supabase),
    getTeamPhotos(),
  ]);
  const ad = profile?.ad ?? profile?.email ?? "Üye";
  const initial = ad.charAt(0).toUpperCase();
  const foto = photoFor(photos, profile?.ad);
  const isAdmin = profile?.role === "admin";

  const { completedIds, bestQuizScores, activityDates, approvedTaskPoints } = dash;
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    approvedTaskPoints,
  });

  const rank = leaderboard.find((r) => r.userId === user!.id)?.sira ?? null;

  const puanDagilimi = pointsBreakdown(stats.completedCount, stats.bestQuizScores, approvedTaskPoints);
  const sertifikalar = earnedCertificates(
    stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon })),
    stats.earnedCompetencies,
  );

  return (
    <AppShell initial={initial} isAdmin={isAdmin} points={stats.points}>
      <Reveal>
        <div className="mb-6 flex items-center gap-4">
          <Avatar ad={ad} src={foto} size="lg" className="shadow-soft" />
          <div>
            <h1 className="font-display text-2xl font-bold text-navy dark:text-white">{ad}</h1>
            <p className="text-sm text-muted">
              {profile?.email}
              {isAdmin && " · Kaptan"}
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80} className="grid grid-cols-2 gap-[18px] sm:grid-cols-3">
        <Card>
          <StatRing pct={stats.overall.pct} label="İlerleme" />
        </Card>
        <Card>
          <StatCard countTo={stats.points} label="Puan" accent />
        </Card>
        <Card>
          <StatCard countTo={onayliGorev ?? 0} label="Onaylı görev" />
        </Card>
      </Reveal>

      <Card className="mt-[18px]">
        <ActivityCalendar activityDates={activityDates} today={new Date()} />
      </Card>

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
                className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-sm font-semibold text-navy hover:bg-accent-soft dark:text-white dark:hover:bg-accent-dark"
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
    </AppShell>
  );
}
