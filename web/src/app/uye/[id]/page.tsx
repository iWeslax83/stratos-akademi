import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { getCurriculum } from "@/lib/curriculum/queries";
import { getMemberProfile } from "@/lib/dashboard/member";
import { isAdminUser } from "@/lib/auth/is-admin";
import { Avatar } from "@/components/ui/Avatar";
import { getTeamPhotos, photoFor } from "@/lib/team/photos";

export const dynamic = "force-dynamic";

export default async function UyeProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Bağımsız sorgular eşzamanlı.
  const [{ data: viewer }, isAdmin, m, curriculum, photos] = await Promise.all([
    supabase.from("profiles").select("ad, email").eq("id", user!.id).single(),
    isAdminUser(supabase, user?.id),
    getMemberProfile(supabase, id),
    getCurriculum(supabase),
    getTeamPhotos(),
  ]);
  const initial = (viewer?.ad ?? viewer?.email ?? "E").charAt(0).toUpperCase();

  if (!m) notFound();

  const tracks = curriculum.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }));

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Üye Profili</p>
      <div className="mb-6 mt-3 flex items-center gap-4">
        <Avatar ad={m.gorunenAd} src={photoFor(photos, m.gorunenAd)} size="lg" />
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
