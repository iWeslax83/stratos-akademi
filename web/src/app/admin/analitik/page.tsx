import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { analitikVerisi } from "@/lib/admin/rapor";
import { RaporIndir } from "@/components/admin/RaporIndir";

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
      <Eyebrow>Yönetim · Analitik</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">İçerik Analitiği</h1>
      <p className="mt-1.5 text-muted">
        {uyeSayisi} üye · {aktifSayisi} aktif (son 7 gün)
      </p>
      <div className="mt-4">
        <RaporIndir />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 text-center">
            <div className="font-display text-2xl font-extrabold text-navy dark:text-white">{k.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-muted">{k.label}</div>
          </Card>
        ))}
      </div>

      {pasifler.length > 0 && (
        <Card className="mt-5 border-accent p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-navy dark:text-white">
            Pasif üyeler ({pasifler.length})
          </h2>
          <p className="mb-3 text-sm text-muted">14+ gündür pasif ya da hiç aktivitesi olmayanlar — bir dürtme iyi gelebilir.</p>
          <div className="flex flex-wrap gap-2">
            {pasifler.map((u, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink dark:bg-accent-dark dark:text-accent"
              >
                {u.ad} · {u.gun === null ? "hiç" : `${u.gun} gün`}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">Dal bazlı tamamlama</h2>
        {dalTamamlama.length === 0 ? (
          <p className="text-sm text-muted">Dal yok.</p>
        ) : (
          <div className="space-y-3">
            {dalTamamlama.map((d, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy dark:text-white">
                    {d.ikon} {d.ad}
                  </span>
                  <span className="text-xs font-bold text-muted">%{d.pct} · {d.lessonCount} ders</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">Üye katılımı</h2>
        {uyeler.length === 0 ? (
          <p className="text-sm text-muted">Üye yok.</p>
        ) : (
          uyeler.map((u, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">{u.ad}</span>
              <span className="text-xs text-muted">{u.ders} ders · {u.puan} puan</span>
              <span
                className={
                  u.aktif
                    ? "w-24 text-right text-xs font-semibold text-green-700 dark:text-green-400"
                    : "w-24 text-right text-xs font-semibold text-muted"
                }
              >
                {u.gun === null ? "hiç" : u.gun === 0 ? "bugün" : `${u.gun} gün önce`}
              </span>
            </div>
          ))
        )}
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
            En az tamamlanan dersler
          </h2>
          {dersler.length === 0 ? (
            <p className="text-sm text-muted">Ders yok.</p>
          ) : (
            dersler.map((d, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-navy dark:text-white">{d.baslik}</div>
                  <div className="truncate text-xs text-muted">{d.yer}</div>
                </div>
                <span className="text-xs font-bold text-navy dark:text-white">
                  {d.tamam}/{uyeSayisi}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
            Quiz performansı (zorlanılan üstte)
          </h2>
          {quizler.length === 0 ? (
            <p className="text-sm text-muted">Quiz yok.</p>
          ) : (
            quizler.map((q, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-navy dark:text-white">{q.baslik}</div>
                  <div className="truncate text-xs text-muted">{q.yer}</div>
                </div>
                <span className="text-xs font-bold text-navy dark:text-white">
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
