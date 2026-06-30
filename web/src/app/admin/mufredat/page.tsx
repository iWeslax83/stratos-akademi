import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TrackForm } from "@/components/admin/TrackForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteTrack } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
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

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, slug, ad, aciklama, ikon, sira")
    .order("sira");
  const list = tracks ?? [];
  const editing = edit ? list.find((t) => t.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Müfredat</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Dallar</h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz dal yok.</p>
        ) : (
          list.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <span className="w-7 text-center text-xs font-bold text-muted">{t.sira}</span>
              <span className="text-lg">{t.ikon ?? "•"}</span>
              <span className="min-w-0 flex-1 break-words text-sm font-bold text-navy dark:text-white">
                {t.ad} <span className="text-xs font-normal text-muted">/{t.slug}</span>
              </span>
              <Link href={`/admin/mufredat/${t.id}`} className="text-xs font-semibold text-muted hover:text-navy dark:hover:text-white">
                Modüller →
              </Link>
              <Link href={`/admin/mufredat?edit=${t.id}`} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
                Düzenle
              </Link>
              <DeleteButton
                onDelete={deleteTrack.bind(null, t.id)}
                uyari={`"${t.ad}" dalını silmek istediğine emin misin? Tüm modülleri, dersleri ve quizleri de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Dalı düzenle" : "Yeni dal"}
        </h2>
        <TrackForm key={editing?.id ?? "new"} editing={editing} />
      </Card>
    </AppShell>
  );
}
