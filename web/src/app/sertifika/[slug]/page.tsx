import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurriculum } from "@/lib/curriculum/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildStats } from "@/lib/dashboard/stats";
import { certificateFor } from "@/lib/certificate/eligibility";
import { PrintButton } from "@/components/certificate/PrintButton";

export const dynamic = "force-dynamic";

function bugun(): string {
  return new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function SertifikaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, curriculum, dash] = await Promise.all([
    supabase.from("profiles").select("ad, email").eq("id", user!.id).single(),
    getCurriculum(supabase),
    getDashboardData(supabase, user!.id),
  ]);
  const ad = profile?.ad ?? profile?.email ?? "Üye";

  const stats = buildStats({
    curriculum,
    completedIds: dash.completedIds,
    bestQuizScores: dash.bestQuizScores,
    activityDates: dash.activityDates,
    today: new Date(),
    approvedTaskPoints: dash.approvedTaskPoints,
  });

  // Belge yalnız gerçekten tamamlanan dal için verilir (sunucuda doğrulanır).
  const tracks = stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }));
  const dal = certificateFor(tracks, stats.earnedCompetencies, slug);
  if (!dal) notFound();

  return (
    <div className="mx-auto max-w-[860px] px-6 py-10">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/profil" className="text-sm font-semibold text-muted hover:text-navy dark:hover:text-white">
          ← Profil
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-bezel border-2 border-gold bg-white p-10 text-center text-navy shadow-[0_20px_50px_-24px_rgba(16,28,55,0.4)] sm:p-16">
        <div className="font-display text-sm font-bold uppercase tracking-[0.3em] text-gold-ink">
          Stratos Akademi
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-navy/60">
          Tofaş Fen Lisesi · TMT-İHA
        </div>

        <h1 className="mt-10 font-display text-3xl font-extrabold">Katılım Belgesi</h1>
        <p className="mt-6 text-sm text-navy/70">Bu belge</p>
        <p className="mt-2 font-display text-2xl font-bold">{ad}</p>
        <p className="mt-4 text-sm text-navy/70">adlı üyenin</p>
        <p className="mt-2 font-display text-xl font-bold text-gold-ink">
          {dal.ikon} {dal.ad} dalını
        </p>
        <p className="mt-2 text-sm text-navy/70">başarıyla tamamladığını belgeler.</p>

        <div className="mt-12 flex items-end justify-between border-t border-navy/15 pt-6 text-left">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-navy/50">Tarih</div>
            <div className="font-display text-sm font-bold">{bugun()}</div>
          </div>
          <div className="text-3xl text-gold-ink">◆</div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-navy/50">Kulüp</div>
            <div className="font-display text-sm font-bold">Stratos / TMT-İHA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
