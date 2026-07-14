import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { InviteForm } from "@/components/admin/InviteForm";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { removeInvite, removeMember } from "@/app/actions/admin-members";
import { pendingInvites, type AllowlistRow, type MemberRow } from "@/lib/admin/members";

export const dynamic = "force-dynamic";

export default async function AdminUyelerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();
  const selfId = user!.id;

  const { data: membersData } = await supabase
    .from("profiles")
    .select("id, email, ad, role, created_at")
    .order("created_at");
  const { data: allowData } = await supabase
    .from("allowlist")
    .select("email, role, created_at")
    .order("created_at");
  const members = (membersData ?? []) as MemberRow[];
  const allowlist = (allowData ?? []) as AllowlistRow[];
  const pending = pendingInvites(allowlist, members);

  return (
    <AppShell initial={initial} isAdmin>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yönetim · Üyeler</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
        Üyeler ve Davetler
      </h1>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
          Üyeler ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted">Henüz üye yok.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="min-w-0 flex-1 break-words text-sm font-semibold text-navy dark:text-white">
                {m.ad ?? m.email}{" "}
                <span className="text-xs font-normal text-muted">{m.email}</span>
                {m.id === selfId && <span className="ml-2 text-xs font-bold text-accent-ink dark:text-accent">(sen)</span>}
              </span>
              <RoleSelect email={m.email} role={m.role} userId={m.id} selfId={selfId} />
              {m.id !== selfId && (
                <DeleteButton
                  onDelete={removeMember.bind(null, m.id, m.email, selfId)}
                  uyari={`${m.email} üyesini ve TÜM verilerini (ilerleme, quiz, görev) kalıcı silmek istediğine emin misin?`}
                />
              )}
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
          Bekleyen davetler ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Bekleyen davet yok.</p>
        ) : (
          pending.map((a) => (
            <div key={a.email} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="min-w-0 flex-1 break-words text-sm font-semibold text-navy dark:text-white">{a.email}</span>
              <RoleSelect email={a.email} role={a.role} userId={null} selfId={selfId} />
              <DeleteButton
                onDelete={removeInvite.bind(null, a.email)}
                uyari={`"${a.email}" davetini silmek istediğine emin misin?`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">Davet et</h2>
        <InviteForm />
      </Card>
    </AppShell>
  );
}
