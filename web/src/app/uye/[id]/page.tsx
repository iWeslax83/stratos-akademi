import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
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
  // Bağımsız sorgular eşzamanlı.
  const [{ data: viewer }, isAdmin, m, curriculum] = await Promise.all([
    supabase.from("profiles").select("ad, email").eq("id", user!.id).single(),
    isAdminUser(supabase, user?.id),
    getMemberProfile(supabase, id),
    getCurriculum(supabase),
  ]);
  const initial = (viewer?.ad ?? viewer?.email ?? "E").charAt(0).toUpperCase();

  if (!m) notFound();

  const tracks = curriculum.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }));

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Eyebrow>Üye Profili</Eyebrow>
      <div className="mb-6 mt-3 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-navy text-2xl font-bold text-white dark:bg-accent dark:text-navy">
          {m.gorunenAd.charAt(0)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">{m.gorunenAd}</h1>
          <p className="text-sm text-muted">Liderlikte #{m.sira}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-[18px]">
        <Card>
          <StatCard value={m.puan} label="Puan" accent />
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
    </AppShell>
  );
}
