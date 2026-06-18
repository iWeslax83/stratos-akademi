import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MarkReadButton } from "@/components/notifications/MarkReadButton";
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
          list.map((n) => {
            const inner = (
              <div
                className={`flex items-start gap-3 border-b border-[var(--line)] py-3 last:border-b-0 ${
                  !n.okundu ? "font-semibold" : ""
                }`}
              >
                {!n.okundu && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                <span className={`flex-1 text-sm ${n.okundu ? "text-muted" : "text-navy dark:text-white"}`}>
                  {n.mesaj}
                </span>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })
        )}
      </Card>
    </AppShell>
  );
}
