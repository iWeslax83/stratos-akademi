import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ara } from "@/lib/search/queries";
import { gecerliSorgu, type SonucTuru } from "@/lib/search/rank";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

const ETIKET: Record<SonucTuru, string> = {
  ders: "Ders",
  modul: "Modül",
  dal: "Dal",
  duyuru: "Duyuru",
  etkinlik: "Etkinlik",
  kaynak: "Kaynak",
};

export default async function AraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = await isAdminUser(supabase, user?.id);
  const initial = (user?.email ?? "E").charAt(0).toUpperCase();

  const sorgu = gecerliSorgu(q);
  const sonuclar = sorgu ? await ara(supabase, sorgu) : [];

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Eyebrow>Arama</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Ara</h1>

      <form action="/ara" className="mt-5 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Ders, duyuru, etkinlik, kaynak…"
          aria-label="Arama terimi"
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-transparent px-4 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
        <button className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy">
          Ara
        </button>
      </form>

      {sorgu === null ? (
        <p className="mt-6 text-sm text-muted">En az iki harf yaz.</p>
      ) : sonuclar.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          &quot;{sorgu}&quot; için sonuç yok.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">{sonuclar.length} sonuç</p>
          <div className="mt-3 flex flex-col gap-2">
            {sonuclar.map((s, i) => (
              <Card key={`${s.tur}-${i}`} className="p-4">
                <Link href={s.href} className="flex items-baseline gap-3">
                  <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted dark:bg-white/10">
                    {ETIKET[s.tur]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-navy dark:text-white">
                      {s.baslik}
                    </span>
                    {s.altBaslik && (
                      <span className="block truncate text-xs text-muted">{s.altBaslik}</span>
                    )}
                  </span>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
