import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCurriculum } from "@/lib/curriculum/queries";
import { flatten } from "@/lib/curriculum/progress";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";
import { quizStat, gunOnce, sonAktivite } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

type ProgressRow = { user_id: string; lesson_id: string; completed_at: string | null };
type AttemptRow = { user_id: string; quiz_id: string; puan: number; created_at: string };
type SubRow = { user_id: string; created_at: string };

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

  const curriculum = await getCurriculum(supabase);
  const leaderboard = await getLeaderboard(supabase);

  const svc = createServiceClient();
  const [{ data: progress }, { data: attempts }, { data: subs }, { data: quizzes }] =
    await Promise.all([
      svc.from("lesson_progress").select("user_id, lesson_id, completed_at").eq("completed", true),
      svc.from("quiz_attempts").select("user_id, quiz_id, puan, created_at"),
      svc.from("task_submissions").select("user_id, created_at"),
      svc.from("quizzes").select("id, gecme_esigi"),
    ]);

  const prog = (progress ?? []) as ProgressRow[];
  const att = (attempts ?? []) as AttemptRow[];
  const sub = (subs ?? []) as SubRow[];
  const esikById = new Map<string, number>();
  for (const q of (quizzes ?? []) as { id: string; gecme_esigi: number }[]) esikById.set(q.id, q.gecme_esigi);

  // dinamik server component; analiz için şu anki zaman kasıtlı (saf-render kuralı geçerli değil)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const uyeSayisi = leaderboard.length;

  // 1) Üye katılımı: tamamlanan ders + son aktivite
  const dersByUser = new Map<string, number>();
  const tarihByUser = new Map<string, (string | null)[]>();
  const push = (uid: string, d: string | null) => {
    const arr = tarihByUser.get(uid) ?? [];
    arr.push(d);
    tarihByUser.set(uid, arr);
  };
  for (const p of prog) {
    dersByUser.set(p.user_id, (dersByUser.get(p.user_id) ?? 0) + 1);
    push(p.user_id, p.completed_at);
  }
  for (const a of att) push(a.user_id, a.created_at);
  for (const s of sub) push(s.user_id, s.created_at);

  const uyeler = leaderboard
    .map((r) => {
      const son = sonAktivite(tarihByUser.get(r.userId) ?? []);
      const gun = gunOnce(son, now);
      return {
        ad: r.gorunenAd,
        puan: r.puan,
        ders: dersByUser.get(r.userId) ?? 0,
        gun,
        aktif: gun !== null && gun <= 7,
      };
    })
    .sort((a, b) => (a.gun ?? 9999) - (b.gun ?? 9999));
  const aktifSayisi = uyeler.filter((u) => u.aktif).length;

  // 2) En az tamamlanan dersler
  const tamamByLesson = new Map<string, Set<string>>();
  for (const p of prog) {
    const set = tamamByLesson.get(p.lesson_id) ?? new Set<string>();
    set.add(p.user_id);
    tamamByLesson.set(p.lesson_id, set);
  }
  const dersler = flatten(curriculum)
    .map((f) => ({
      baslik: f.lesson.baslik,
      yer: `${f.track.ad} · ${f.module.ad}`,
      tamam: tamamByLesson.get(f.lesson.id)?.size ?? 0,
    }))
    .sort((a, b) => a.tamam - b.tamam)
    .slice(0, 10);

  // 3) Quiz performansı (zorlanılan üstte)
  const attByQuiz = new Map<string, AttemptRow[]>();
  for (const a of att) {
    const arr = attByQuiz.get(a.quiz_id) ?? [];
    arr.push(a);
    attByQuiz.set(a.quiz_id, arr);
  }
  const quizler = curriculum
    .flatMap((t) => t.modules.filter((m) => m.quiz).map((m) => ({ quiz: m.quiz!, yer: `${t.ad} · ${m.ad}` })))
    .map(({ quiz, yer }) => {
      const st = quizStat(attByQuiz.get(quiz.id) ?? [], esikById.get(quiz.id) ?? 70);
      return { baslik: quiz.baslik, yer, ...st };
    })
    .sort((a, b) => a.ortBest - b.ortBest);

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Analitik</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">İçerik Analitiği</h1>
      <p className="mt-1.5 text-muted">
        {uyeSayisi} üye · {aktifSayisi} aktif (son 7 gün)
      </p>

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
