import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getAnnouncements } from "@/lib/announcements/queries";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function DuyurularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = await isAdminUser(supabase, user?.id);

  const duyurular = await getAnnouncements(supabase);

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Eyebrow>Duyurular</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Duyurular</h1>

      {duyurular.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Henüz duyuru yok.</p>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {duyurular.map((d) => (
            <Card key={d.id} className="p-6">
              <h2 className="font-display text-lg font-bold text-navy dark:text-white">{d.baslik}</h2>
              <div className="text-xs text-muted">{formatDate(d.created_at)}</div>
              <p className="mt-2 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">{d.icerik}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
