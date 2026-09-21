import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LessonForm } from "@/components/admin/LessonForm";
import { VideoEkle } from "@/components/admin/VideoEkle";
import { SiraButonlari } from "@/components/admin/SiraButonlari";
import { formatSure } from "@/lib/lessons/format";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteLesson } from "@/app/actions/admin-curriculum";
import { smallButtonClasses } from "@/components/ui/Button";

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
    .order("sira")
    .order("id");
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
      <h1 className="mt-1 font-display text-3xl font-bold text-fg">
        {modul.ad} · Dersler
      </h1>

      <Card className="mt-5 px-5">
        <ul>
          <li className="flex items-center justify-between border-b border-[var(--line)] py-4">
            <span className="text-sm font-semibold text-fg">Modül Quizi</span>
            <Link href={`/admin/mufredat/${trackId}/${moduleId}/quiz`} className={smallButtonClasses("soft")}>
              Quiz&apos;i düzenle →
            </Link>
          </li>
          <li className="flex items-center justify-between py-4">
            <span className="text-sm font-semibold text-fg">Pratik Görevler</span>
            <Link href={`/admin/mufredat/${trackId}/${moduleId}/gorevler`} className={smallButtonClasses("soft")}>
              Görevleri düzenle →
            </Link>
          </li>
        </ul>
      </Card>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz ders yok.</p>
        ) : (
          list.map((l, i) => (
            <div
              key={l.id}
              className="flex flex-col gap-2 border-b border-[var(--line)] py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-x-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-7 shrink-0 text-center text-xs font-bold tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 break-words text-sm font-bold text-fg">
                  {l.baslik}{" "}
                  <span className="text-xs font-normal tabular-nums text-muted">{formatSure(l.sure_sn)} · {l.youtube_video_id}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-10 sm:shrink-0 sm:pl-0">
                <SiraButonlari id={l.id} trackId={trackId} baslik={l.baslik} ilk={i === 0} son={i === list.length - 1} />
                <Link
                  href={`/admin/mufredat/${trackId}/${moduleId}?edit=${l.id}`}
                  className={smallButtonClasses("ghost")}
                >
                  Düzenle
                </Link>
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
        <h2 className="mb-4 font-display text-lg font-bold text-fg">
          {editing ? "Dersi düzenle" : "Video ekle"}
        </h2>
        {editing ? (
          <LessonForm key={editing.id} trackId={trackId} moduleId={moduleId} editing={editing} />
        ) : (
          <VideoEkle moduleId={moduleId} />
        )}
      </Card>
    </AppShell>
  );
}
