import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { analitikVerisi } from "@/lib/admin/rapor";
import { RaporIndir } from "@/components/admin/RaporIndir";
import { PassiveNudgeButton } from "@/components/admin/PassiveNudgeButton";
import { TrackIcon } from "@/components/ui/TrackIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UyeKatilimTablosu } from "@/components/admin/UyeKatilimTablosu";
import { StatStrip } from "@/components/admin/StatStrip";

export const dynamic = "force-dynamic";

export default async function AnalitikPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewer } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (viewer?.ad ?? viewer?.email ?? "E").charAt(0).toUpperCase();

  // dinamik server component; analiz için şu anki zaman kasıtlı (saf-render kuralı geçerli değil)
  // eslint-disable-next-line react-hooks/purity
  const veri = await analitikVerisi(supabase, createServiceClient(), Date.now());
  const {
    uyeSayisi, aktifSayisi, bekleyenOnay, toplamTamamlanan, ortTamamlama,
    uyeler, pasifler, quizler, dalTamamlama,
  } = veri;
  const dersler = veri.dersler.slice(0, 10); // ekranda yalnız en az tamamlanan 10 ders; CSV'de hepsi var

  const kpis = [
    { label: "Üye", value: String(uyeSayisi) },
    { label: "Aktif (7g)", value: String(aktifSayisi) },
    { label: "Bekleyen onay", value: String(bekleyenOnay ?? 0) },
    { label: "Tamamlanan ders", value: String(toplamTamamlanan) },
    { label: "Ort. tamamlama", value: `%${ortTamamlama}` },
  ];

  return (
    <AppShell initial={initial} isAdmin>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Yönetim · Analitik</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-fg">İçerik Analitiği</h1>
      <p className="mt-1.5 text-muted">
        {uyeSayisi} üye · {aktifSayisi} aktif (son 7 gün)
      </p>
      <div className="mt-4">
        <RaporIndir />
      </div>

      <div className="mt-5">
        <StatStrip items={kpis} />
      </div>

      {pasifler.length > 0 && (
        <Card className="mt-5 border-accent p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-fg">
            Pasif üyeler ({pasifler.length})
          </h2>
          <p className="mb-3 text-sm text-muted">14+ gündür pasif ya da hiç aktivitesi olmayanlar. Bir dürtme iyi gelebilir.</p>
          <div className="flex flex-col gap-2">
            {pasifler.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-accent-ink/25 bg-accent-wash px-3 py-1.5 text-xs font-semibold text-accent-fg dark:border-accent/25">
                  <span className="truncate">{u.ad}</span>
                  <span className="shrink-0">· {u.gun === null ? "hiç" : `${u.gun} gün`}</span>
                </span>
                <PassiveNudgeButton userId={u.id} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-fg">Dal bazlı tamamlama</h2>
        {dalTamamlama.length === 0 ? (
          <p className="text-sm text-muted">Dal yok.</p>
        ) : (
          <div className="space-y-3">
            {dalTamamlama.map((d, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold text-fg">
                    <TrackIcon ikon={d.ikon} size={16} className="text-accent-fg" />
                    {d.ad}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-muted">%{d.pct} · {d.lessonCount} ders</span>
                </div>
                <ProgressBar pct={d.pct} label={`${d.ad} tamamlama`} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-fg">Üye katılımı</h2>
        <UyeKatilimTablosu uyeler={uyeler} />
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">
            En az tamamlanan dersler
          </h2>
          {dersler.length === 0 ? (
            <p className="text-sm text-muted">Ders yok.</p>
          ) : (
            dersler.map((d, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-fg">{d.baslik}</div>
                  <div className="truncate text-xs text-muted">{d.yer}</div>
                </div>
                <span className="text-xs font-bold tabular-nums text-fg">
                  {d.tamam}/{uyeSayisi}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">
            Quiz performansı (zorlanılan üstte)
          </h2>
          {quizler.length === 0 ? (
            <p className="text-sm text-muted">Quiz yok.</p>
          ) : (
            quizler.map((q, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-fg">{q.baslik}</div>
                  <div className="truncate text-xs text-muted">{q.yer}</div>
                  <ProgressBar pct={q.ortBest} label={`${q.baslik} ortalama en iyi puan`} heightClass="h-1.5" className="mt-1.5" />
                </div>
                <span className="text-xs font-bold tabular-nums text-fg">
                  ort %{q.ortBest} · {q.gecen}/{q.deneyen} geçti
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </AppShell>
  );
}
