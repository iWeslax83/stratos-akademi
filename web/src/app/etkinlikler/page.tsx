import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { getEvents } from "@/lib/events/queries";
import { partitionEvents, type EventLite } from "@/lib/events/format";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventCard({ e, gecmis }: { e: EventLite; gecmis?: boolean }) {
  return (
    <Card className={gecmis ? "p-6 opacity-70" : "p-6"}>
      <h2 className="font-display text-lg font-bold text-navy dark:text-white">{e.baslik}</h2>
      <div className="text-sm font-semibold text-gold-ink dark:text-gold">
        {formatDateTime(e.baslangic)}
        {e.yer && <span className="text-muted"> · {e.yer}</span>}
      </div>
      {e.aciklama && (
        <p className="mt-2 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">{e.aciklama}</p>
      )}
    </Card>
  );
}

export default async function EtkinliklerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = await isAdminUser(supabase, user?.id);

  const events = await getEvents(supabase);
  // dinamik server component; "şimdi" kasıtlı (saf-render kuralı geçerli değil)
  // eslint-disable-next-line react-hooks/purity
  const { upcoming, past } = partitionEvents(events, Date.now());

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <Reveal>
        <Eyebrow>Etkinlikler</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Etkinlikler</h1>
      </Reveal>

      {upcoming.length === 0 && past.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Henüz etkinlik yok.</p>
        </Card>
      ) : (
        <>
          <h2 className="mt-6 mb-3 font-display text-lg font-bold text-navy dark:text-white">Yaklaşan</h2>
          {upcoming.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-muted">Yaklaşan etkinlik yok.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mt-8 mb-3 font-display text-lg font-bold text-navy dark:text-white">Geçmiş</h2>
              <div className="space-y-4">
                {past.map((e) => (
                  <EventCard key={e.id} e={e} gecmis />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
