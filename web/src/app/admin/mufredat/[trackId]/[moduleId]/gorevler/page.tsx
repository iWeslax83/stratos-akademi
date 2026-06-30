import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { TaskForm } from "@/components/admin/TaskForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteTask } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";

type Task = { id: string; baslik: string; aciklama: string | null; sira: number; puan: number };

export default async function AdminGorevlerPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string; moduleId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { trackId, moduleId } = await params;
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
  const { data: modul } = await supabase.from("modules").select("id, ad").eq("id", moduleId).single();
  if (!track || !modul) notFound();

  const { data: tasksData } = await supabase
    .from("practical_tasks")
    .select("id, baslik, aciklama, sira, puan")
    .eq("module_id", moduleId)
    .order("sira");
  const list = (tasksData ?? []) as Task[];
  const editing = edit ? list.find((t) => t.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: modul.ad, href: `/admin/mufredat/${trackId}/${moduleId}` },
          { label: "Pratik Görevler" },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {modul.ad} · Pratik Görevler
      </h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz görev yok.</p>
        ) : (
          list.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="w-7 text-center text-xs font-bold text-muted">{t.sira}</span>
              <span className="min-w-0 flex-1 break-words text-sm font-bold text-navy dark:text-white">
                {t.baslik} <span className="text-xs font-normal text-muted">· {t.puan} puan</span>
              </span>
              <a
                href={`/admin/mufredat/${trackId}/${moduleId}/gorevler?edit=${t.id}`}
                className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white"
              >
                Düzenle
              </a>
              <DeleteButton
                onDelete={deleteTask.bind(null, t.id)}
                uyari={`"${t.baslik}" görevini silmek istediğine emin misin? Gönderimler de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Görevi düzenle" : "Yeni görev"}
        </h2>
        <TaskForm key={editing?.id ?? "new"} trackId={trackId} moduleId={moduleId} editing={editing} />
        {editing && (
          <a href={`/admin/mufredat/${trackId}/${moduleId}/gorevler`} className="mt-3 inline-block text-xs font-semibold text-muted">
            İptal
          </a>
        )}
      </Card>
    </AppShell>
  );
}
