import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { badgeProgress } from "@/lib/badges/compute";
import { getCurriculum } from "@/lib/curriculum/queries";
import { getMemberProfile } from "@/lib/dashboard/member";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function UyeProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewer } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (viewer?.ad ?? viewer?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = await isAdminUser(supabase, user?.id);

  const m = await getMemberProfile(supabase, id);
  if (!m) notFound();

  const curriculum = await getCurriculum(supabase);
  const tracks = curriculum.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }));

  // Başka üye: yalnız public rozetler (RPC streak/quiz vermez).
  const badgeItems = badgeProgress(
    {
      lessons: m.tamamlananDers,
      tasks: m.onayliGorev,
      competencies: m.yetkinlikler.length,
      points: m.puan,
      streak: 0,
      quizPerfect: 0,
    },
    "public",
  );

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Eyebrow>Üye Profili</Eyebrow>
      <div className="mb-6 mt-3 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-navy text-2xl font-bold text-white dark:bg-gold dark:text-navy">
          {m.gorunenAd.charAt(0)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">{m.gorunenAd}</h1>
          <p className="text-sm text-muted">Liderlikte #{m.sira}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[18px]">
        <Card>
          <StatCard value={m.puan} label="Puan" gold />
        </Card>
        <Card>
          <StatCard value={m.tamamlananDers} label="Tamamlanan ders" />
        </Card>
        <Card>
          <StatCard value={m.onayliGorev} label="Onaylı görev" />
        </Card>
      </div>

      <Card className="mt-[18px]">
        <CompetencyShelf tracks={tracks} earned={m.yetkinlikler} rank={null} />
      </Card>

      <Card className="mt-[18px]">
        <BadgeShelf items={badgeItems} />
      </Card>
    </AppShell>
  );
}
