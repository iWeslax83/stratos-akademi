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
import { Toast } from "@/components/dashboard/Toast";
import { Reveal } from "@/components/ui/Reveal";
import { OnboardingCard } from "@/components/dashboard/OnboardingCard";
import { isNewMember, welcomeHeading } from "@/lib/dashboard/onboarding";
import { getApprovedTaskCount } from "@/lib/tasks/queries";
import { syncCompetencies } from "@/app/actions/competencies";
import { getAnnouncements } from "@/lib/announcements/queries";
import { announcementExcerpt } from "@/lib/announcements/format";
import { getUpcomingEvents } from "@/lib/events/queries";
import Link from "next/link";

function etkinlikTarih(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const dynamic = "force-dynamic";

export default async function PanomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bağımsız sorgular eşzamanlı (dashboard gecikmesini azaltır).
  const [{ data: profile }, curriculum, dash, leaderboard, onayliGorev, duyurular, etkinlikler] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
    getLeaderboard(supabase),
    getApprovedTaskCount(supabase, user!.id),
    getAnnouncements(supabase, 3),
    getUpcomingEvents(supabase, 3),
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
  const isNew = isNewMember({
    completed: completedIds.size,
    activity: activityDates.length,
    approvedTasks: onayliGorev ?? 0,
  });

  return (
    <AppShell initial={initial} streak={stats.streak} points={stats.points} isAdmin={isAdmin}>
      <Reveal as="div" className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          {welcomeHeading(ad, isNew)}
        </h1>
        <p className="mt-1.5 text-muted">
          {isNew
            ? "İlk dersinle başla; ilerlemen ve sıralaman burada görünecek."
            : `Toplam ilerleme: ${stats.overall.done}/${stats.overall.total} ders · %${stats.overall.pct}`}
        </p>
      </Reveal>

      <Reveal as="div" delay={80} className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-12">
        {duyurular.length > 0 && (
          <Card interactive outerClassName="lg:col-span-12" className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy dark:text-white">Duyurular</h2>
              <Link href="/duyurular" className="text-xs font-semibold text-gold-ink dark:text-gold hover:opacity-80">
                Tümü →
              </Link>
            </div>
            <ul className="space-y-2">
              {duyurular.map((d) => (
                <li key={d.id} className="border-b border-[var(--line)] pb-2 last:border-b-0 last:pb-0">
                  <Link href="/duyurular" className="block">
                    <span className="text-sm font-semibold text-navy dark:text-white">{d.baslik}</span>
                    <span className="ml-2 text-sm text-muted">{announcementExcerpt(d.icerik, 90)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {etkinlikler.length > 0 && (
          <Card interactive outerClassName="lg:col-span-12" className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy dark:text-white">Yaklaşan etkinlikler</h2>
              <Link href="/etkinlikler" className="text-xs font-semibold text-gold-ink dark:text-gold hover:opacity-80">
                Tümü →
              </Link>
            </div>
            <ul className="space-y-2">
              {etkinlikler.map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 border-b border-[var(--line)] pb-2 last:border-b-0 last:pb-0">
                  <span className="shrink-0 text-xs font-bold text-gold-ink dark:text-gold">{etkinlikTarih(e.baslangic)}</span>
                  <span className="text-sm font-semibold text-navy dark:text-white">{e.baslik}</span>
                  {e.yer && <span className="text-xs text-muted">· {e.yer}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {isNew ? (
          <Card outerClassName="lg:col-span-12">
            <OnboardingCard
              firstLessonId={resume?.lesson.id ?? null}
              firstLessonTitle={resume?.lesson.baslik ?? null}
            />
          </Card>
        ) : (
          <>
            <Card interactive outerClassName="h-full lg:col-span-7" className="h-full">
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
                <StatCard countTo={stats.streak} label="Günlük seri (gün)" />
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
          </>
        )}
      </Reveal>
      <Toast baslik="Yeni yetkinlik" adlar={yeniAdlar} />
    </AppShell>
  );
}
