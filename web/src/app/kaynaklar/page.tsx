import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { getResources } from "@/lib/resources/queries";
import { groupByCategory, KATEGORILER } from "@/lib/resources/group";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function KaynaklarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = await isAdminUser(supabase, user?.id);

  const resources = await getResources(supabase);
  const gruplar = groupByCategory(resources, KATEGORILER);

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Reveal>
        <Eyebrow>Kaynaklar</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Kaynak kütüphanesi</h1>
        <p className="mt-1.5 text-muted">Datasheet, CAD, BOM, repo ve faydalı bağlantılar.</p>
      </Reveal>

      {gruplar.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Henüz kaynak eklenmedi.</p>
        </Card>
      ) : (
        <div className="mt-5 space-y-5">
          {gruplar.map((g) => (
            <Card key={g.kategori} className="p-6">
              <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">{g.kategori}</h2>
              <ul className="space-y-3">
                {g.items.map((r) => (
                  <li key={r.id} className="border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-navy underline decoration-accent underline-offset-2 hover:text-accent-ink dark:hover:text-accent dark:text-white"
                    >
                      {r.baslik} →
                    </a>
                    {r.aciklama && <p className="mt-0.5 text-sm text-muted">{r.aciklama}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
