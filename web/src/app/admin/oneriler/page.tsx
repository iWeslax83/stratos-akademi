import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { OneriKarti } from "@/components/admin/OneriKarti";
import { CopKutusuKarti } from "@/components/admin/CopKutusuKarti";
import { TaraSimdiButton } from "@/components/admin/TaraSimdiButton";
import { TaramaTeshis, type ScanRun } from "@/components/admin/TaramaTeshis";

export const dynamic = "force-dynamic";

export default async function OnerilerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("ad, email").eq("id", user!.id).single();
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const { data: modulesRaw } = await supabase
    .from("modules").select("id, ad, track_id, tracks(ad)").order("sira");
  const modules = ((modulesRaw ?? []) as unknown as { id: string; ad: string; tracks: { ad: string } | null }[])
    .map((m) => ({ id: m.id, ad: m.ad, trackAd: m.tracks?.ad ?? "" }));

  const { data: pending } = await supabase
    .from("video_suggestions")
    .select("id, youtube_video_id, baslik, kanal, izlenme, yayin_tarihi, uygunluk_skoru, gerekce, onerilen_module_id")
    .eq("durum", "pending")
    .order("uygunluk_skoru", { ascending: false });

  const { data: trash } = await supabase
    .from("video_suggestions")
    .select("id, youtube_video_id, baslik, rejected_at")
    .eq("durum", "rejected")
    .order("rejected_at", { ascending: false })
    .limit(30);

  const { data: runs } = await supabase
    .from("video_scan_runs")
    .select("id, created_at, taranan, aday, eklenen, budanan, hata, diag")
    .order("created_at", { ascending: false })
    .limit(5);

  const pendingRows = (pending ?? []) as {
    id: string; youtube_video_id: string; baslik: string; kanal: string | null;
    izlenme: number | null; yayin_tarihi: string | null; uygunluk_skoru: number | null;
    gerekce: string | null; onerilen_module_id: string | null;
  }[];
  const trashRows = (trash ?? []) as {
    id: string; youtube_video_id: string; baslik: string; rejected_at: string | null;
  }[];

  return (
    <AppShell initial={initial} isAdmin>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yönetim · Öneriler</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
            Video Önerileri ({pendingRows.length})
          </h1>
        </div>
        <TaraSimdiButton />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {pendingRows.length === 0 ? (
          <Card><p className="text-navy/70 dark:text-white/70">Bekleyen öneri yok.</p></Card>
        ) : (
          pendingRows.map((r) => (
            <Card key={r.id}>
              <OneriKarti
                id={r.id}
                youtubeId={r.youtube_video_id}
                baslik={r.baslik}
                kanal={r.kanal}
                izlenme={r.izlenme}
                yayinTarihi={r.yayin_tarihi}
                skor={r.uygunluk_skoru}
                gerekce={r.gerekce}
                onerilenModuleId={r.onerilen_module_id}
                modules={modules}
              />
            </Card>
          ))
        )}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-navy dark:text-white">
        Tarama Geçmişi
      </h2>
      <div className="mt-4">
        <TaramaTeshis runs={(runs ?? []) as ScanRun[]} />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-navy dark:text-white">
        Çöp Kutusu ({trashRows.length})
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {trashRows.length === 0 ? (
          <Card><p className="text-navy/70 dark:text-white/70">Çöp kutusu boş.</p></Card>
        ) : (
          trashRows.map((r) => (
            <Card key={r.id}>
              <CopKutusuKarti id={r.id} youtubeId={r.youtube_video_id} baslik={r.baslik} rejectedAt={r.rejected_at} />
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
