import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { getLeaderboard, getLeaderboardRanged } from "@/lib/dashboard/leaderboard";
import { parseAralik, rangeStartISO, aralikLabel, type Aralik } from "@/lib/dashboard/range";
import { Avatar } from "@/components/ui/Avatar";
import { getTeamPhotos, photoFor } from "@/lib/team/photos";

export const dynamic = "force-dynamic";

const SEKMELER: { key: Aralik; label: string }[] = [
  { key: "tum", label: "Tüm zamanlar" },
  { key: "ay", label: "Son 30 gün" },
  { key: "hafta", label: "Son 7 gün" },
];

export default async function LiderlikPage({
  searchParams,
}: {
  searchParams: Promise<{ aralik?: string }>;
}) {
  const { aralik: araStr } = await searchParams;
  const aralik = parseAralik(araStr);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Profil ve sıralama bağımsız → eşzamanlı.
  const [{ data: profile }, rows, photos] = await Promise.all([
    supabase.from("profiles").select("ad, email, role").eq("id", user!.id).single(),
    aralik === "tum"
      ? getLeaderboard(supabase)
      : // dinamik server component; şu anki zaman kasıtlı (saf-render kuralı burada geçerli değil)
        // eslint-disable-next-line react-hooks/purity
        getLeaderboardRanged(supabase, rangeStartISO(aralik, Date.now())),
    getTeamPhotos(),
  ]);
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Reveal className="mb-5">
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Sıralama Tablosu
        </h1>
        <p className="mt-1.5 text-muted">{aralikLabel(aralik)} · ders, quiz ve onaylı görev puanı.</p>
      </Reveal>

      <div className="mb-4 flex gap-2">
        {SEKMELER.map((s) => (
          <Link
            key={s.key}
            href={s.key === "tum" ? "/liderlik" : `/liderlik?aralik=${s.key}`}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
              aralik === s.key
                ? "bg-navy text-white dark:bg-accent dark:text-navy"
                : "bg-black/5 text-muted hover:text-navy dark:bg-white/10 dark:hover:text-white",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Reveal delay={80}>
      <Card className="p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Bu aralıkta sıralama yok.</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.userId}
              className={clsx(
                "flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0",
                r.userId === user!.id && "-mx-3 rounded-xl border-b-0 bg-accent-soft px-3 dark:bg-accent-dark",
              )}
            >
              <span
                className={clsx(
                  "w-7 text-center font-display text-sm font-extrabold",
                  r.sira <= 3 ? "text-accent-ink dark:text-accent" : "text-muted",
                )}
              >
                {r.sira}
              </span>
              <Avatar ad={r.gorunenAd} src={photoFor(photos, r.gorunenAd)} />
              <Link
                href={`/uye/${r.userId}`}
                className="min-w-0 flex-1 truncate text-sm font-bold text-navy hover:text-accent-ink dark:hover:text-accent dark:text-white"
              >
                {r.gorunenAd}
                {r.userId === user!.id && " (sen)"}
              </Link>
              <span className="shrink-0 font-display text-sm font-bold text-accent-ink dark:text-accent">
                {r.puan} puan
              </span>
            </div>
          ))
        )}
      </Card>
      </Reveal>
    </AppShell>
  );
}
