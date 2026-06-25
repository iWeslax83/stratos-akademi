import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EventForm } from "@/components/admin/EventForm";
import { EventItem } from "@/components/admin/EventItem";
import { getEvents } from "@/lib/events/queries";
import { partitionEvents } from "@/lib/events/format";

export const dynamic = "force-dynamic";

export default async function AdminEtkinliklerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();

  const events = await getEvents(supabase);
  // dinamik server component; "şimdi" kasıtlı (saf-render kuralı geçerli değil)
  // eslint-disable-next-line react-hooks/purity
  const { upcoming, past } = partitionEvents(events, Date.now());

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Etkinlikler</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Etkinlikler</h1>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">Yeni etkinlik</h2>
        <EventForm />
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-2 font-display text-lg font-bold text-navy dark:text-white">
          Yaklaşan ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Yaklaşan etkinlik yok.</p>
        ) : (
          upcoming.map((e) => (
            <EventItem key={e.id} id={e.id} baslik={e.baslik} aciklama={e.aciklama} baslangic={e.baslangic} yer={e.yer} />
          ))
        )}
      </Card>

      {past.length > 0 && (
        <Card className="mt-5 p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-navy dark:text-white">Geçmiş ({past.length})</h2>
          {past.map((e) => (
            <EventItem key={e.id} id={e.id} baslik={e.baslik} aciklama={e.aciklama} baslangic={e.baslangic} yer={e.yer} gecmis />
          ))}
        </Card>
      )}
    </AppShell>
  );
}
