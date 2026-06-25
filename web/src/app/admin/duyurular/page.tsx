import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AnnouncementItem } from "@/components/admin/AnnouncementItem";
import { getAnnouncements } from "@/lib/announcements/queries";

export const dynamic = "force-dynamic";

export default async function AdminDuyurularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();

  const duyurular = await getAnnouncements(supabase);

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Duyurular</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Duyurular</h1>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">Yeni duyuru</h2>
        <AnnouncementForm />
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-2 font-display text-lg font-bold text-navy dark:text-white">
          Yayınlananlar ({duyurular.length})
        </h2>
        {duyurular.length === 0 ? (
          <p className="text-sm text-muted">Henüz duyuru yok.</p>
        ) : (
          duyurular.map((d) => (
            <AnnouncementItem key={d.id} id={d.id} baslik={d.baslik} icerik={d.icerik} createdAt={d.created_at} />
          ))
        )}
      </Card>
    </AppShell>
  );
}
