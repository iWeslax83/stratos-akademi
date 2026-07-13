import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LessonForm } from "@/components/admin/LessonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteLesson } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage({
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

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, baslik, youtube_video_id, aciklama, sure_sn, sira")
    .eq("module_id", moduleId)
    .order("sira");
  const list = lessons ?? [];
  const editing = edit ? list.find((l) => l.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: modul.ad },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {modul.ad} · Dersler
      </h1>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy dark:text-white">Modül Quizi</span>
          <a
            href={`/admin/mufredat/${trackId}/${moduleId}/quiz`}
            className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-[#6f560a] dark:bg-gold-dark dark:text-[#ffd54a]"
          >
            Quiz&apos;i düzenle →
          </a>
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy dark:text-white">Pratik Görevler</span>
          <a
            href={`/admin/mufredat/${trackId}/${moduleId}/gorevler`}
            className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-[#6f560a] dark:bg-gold-dark dark:text-[#ffd54a]"
          >
            Görevleri düzenle →
          </a>
        </div>
      </Card>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz ders yok.</p>
        ) : (
          list.map((l) => (
            <div
              key={l.id}
              className="flex flex-col gap-2 border-b border-[var(--line)] py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-x-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-7 shrink-0 text-center text-xs font-bold text-muted">{l.sira}</span>
                <span className="min-w-0 flex-1 break-words text-sm font-bold text-navy dark:text-white">
                  {l.baslik}{" "}
                  <span className="text-xs font-normal text-muted">({l.youtube_video_id})</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-10 sm:shrink-0 sm:pl-0">
                <a
                  href={`/admin/mufredat/${trackId}/${moduleId}?edit=${l.id}`}
                  className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white"
                >
                  Düzenle
                </a>
                <DeleteButton
                  onDelete={deleteLesson.bind(null, l.id, trackId, moduleId)}
                  uyari={`"${l.baslik}" dersini silmek istediğine emin misin?`}
                />
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Dersi düzenle" : "Yeni ders"}
        </h2>
        <LessonForm key={editing?.id ?? "new"} trackId={trackId} moduleId={moduleId} editing={editing} />
      </Card>
    </AppShell>
  );
}
