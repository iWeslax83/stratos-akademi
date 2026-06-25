import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { ResourceItem } from "@/components/admin/ResourceItem";
import { getResources } from "@/lib/resources/queries";
import { groupByCategory, KATEGORILER } from "@/lib/resources/group";

export const dynamic = "force-dynamic";

export default async function AdminKaynaklarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();

  const resources = await getResources(supabase);
  const gruplar = groupByCategory(resources, KATEGORILER);

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Kaynaklar</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Kaynak kütüphanesi</h1>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">Yeni kaynak</h2>
        <ResourceForm />
      </Card>

      {gruplar.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Henüz kaynak yok.</p>
        </Card>
      ) : (
        gruplar.map((g) => (
          <Card key={g.kategori} className="mt-5 p-6">
            <h2 className="mb-2 font-display text-lg font-bold text-navy dark:text-white">
              {g.kategori} ({g.items.length})
            </h2>
            {g.items.map((r) => (
              <ResourceItem key={r.id} id={r.id} baslik={r.baslik} url={r.url} kategori={r.kategori} aciklama={r.aciklama} />
            ))}
          </Card>
        ))
      )}
    </AppShell>
  );
}
