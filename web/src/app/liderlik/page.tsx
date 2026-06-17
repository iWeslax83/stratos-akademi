import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";

export const dynamic = "force-dynamic";

export default async function LiderlikPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email, role")
    .eq("id", user!.id)
    .single();
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = profile?.role === "admin";

  const rows = await getLeaderboard(supabase);

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <div className="mb-5">
        <Eyebrow>Liderlik</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Sıralama Tablosu
        </h1>
        <p className="mt-1.5 text-muted">Ders ve quizlerden topladığın puana göre.</p>
      </div>

      <Card className="p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Liderlik şu an yüklenemedi.</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.userId}
              className={clsx(
                "flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0",
                r.userId === user!.id && "-mx-3 rounded-xl border-b-0 bg-gold-soft px-3 dark:bg-gold-dark",
              )}
            >
              <span
                className={clsx(
                  "w-7 text-center font-display text-sm font-extrabold",
                  r.sira <= 3 ? "text-gold" : "text-muted",
                )}
              >
                {r.sira}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white dark:bg-gold dark:text-navy">
                {r.gorunenAd.charAt(0)}
              </span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">
                {r.gorunenAd}
                {r.userId === user!.id && " (sen)"}
              </span>
              <span className="font-display text-sm font-bold text-[#8a6d12] dark:text-[#ffd54a]">
                {r.puan} puan
              </span>
            </div>
          ))
        )}
      </Card>
    </AppShell>
  );
}
