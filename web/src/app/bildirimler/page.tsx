import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MarkReadButton } from "@/components/notifications/MarkReadButton";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { getNotifications } from "@/lib/notifications/queries";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function BildirimlerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();
  const isAdmin = await isAdminUser(supabase, user?.id);

  const list = await getNotifications(supabase);
  const unread = list.filter((n) => !n.okundu).length;

  return (
    <AppShell initial={initial} isAdmin={isAdmin}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <Eyebrow>Bildirimler</Eyebrow>
          <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Bildirimler</h1>
        </div>
        {unread > 0 && <MarkReadButton />}
      </div>

      <Card className="p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Bildirimin yok.</p>
        ) : (
          list.map((n) => (
            <NotificationItem key={n.id} id={n.id} mesaj={n.mesaj} link={n.link} okundu={n.okundu} />
          ))
        )}
      </Card>
    </AppShell>
  );
}
