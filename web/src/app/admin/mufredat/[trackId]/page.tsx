import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteModule } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { trackId } = await params;
  const { edit } = await searchParams;
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

  const { data: track } = await supabase.from("tracks").select("id, ad").eq("id", trackId).single();
  if (!track) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, ad, aciklama, sira")
    .eq("track_id", trackId)
    .order("sira");
  const list = modules ?? [];
  const editing = edit ? list.find((m) => m.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[{ label: "Müfredat", href: "/admin/mufredat" }, { label: track.ad }]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {track.ad} · Modüller
      </h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz modül yok.</p>
        ) : (
          list.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <span className="w-7 text-center text-xs font-bold text-muted">{m.sira}</span>
              <span className="min-w-0 flex-1 break-words text-sm font-bold text-navy dark:text-white">{m.ad}</span>
              <Link href={`/admin/mufredat/${trackId}/${m.id}`} className="text-xs font-semibold text-muted hover:text-navy dark:hover:text-white">
                Dersler →
              </Link>
              <Link href={`/admin/mufredat/${trackId}?edit=${m.id}`} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
                Düzenle
              </Link>
              <DeleteButton
                onDelete={deleteModule.bind(null, m.id, trackId)}
                uyari={`"${m.ad}" modülünü silmek istediğine emin misin? Dersleri ve quizi de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Modülü düzenle" : "Yeni modül"}
        </h2>
        <ModuleForm key={editing?.id ?? "new"} trackId={trackId} editing={editing} />
      </Card>
    </AppShell>
  );
}
