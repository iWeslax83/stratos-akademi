import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurriculum } from "@/lib/curriculum/queries";
import { flatten } from "@/lib/curriculum/progress";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";
import { quizStat, gunOnce, sonAktivite, riskliUyeler, trackCompletionPct } from "@/lib/admin/analytics";

type ProgressRow = { user_id: string; lesson_id: string; completed_at: string | null };
type AttemptRow = { user_id: string; quiz_id: string; puan: number; created_at: string };
type SubRow = { user_id: string; created_at: string };

export type UyeSatiri = { ad: string; puan: number; ders: number; gun: number | null; aktif: boolean };
export type DersSatiri = { baslik: string; yer: string; tamam: number };
export type QuizSatiri = { baslik: string; yer: string; ortBest: number; gecen: number; deneyen: number };
export type DalSatiri = { ad: string; ikon: string | null; lessonCount: number; pct: number };

export type AnalitikVerisi = {
  uyeSayisi: number;
  aktifSayisi: number;
  bekleyenOnay: number;
  toplamTamamlanan: number;
  ortTamamlama: number;
  uyeler: UyeSatiri[];
  pasifler: UyeSatiri[];
  dersler: DersSatiri[];
  quizler: QuizSatiri[];
  dalTamamlama: DalSatiri[];
};

// Analitik sayfası ve CSV dışa aktarımı aynı kaynaktan beslenir — yoksa zamanla birbirinden sapar.
// supabase: oturum istemcisi (müfredat/lider tablosu). svc: service_role (herkesin ilerlemesi).
export async function analitikVerisi(
  supabase: SupabaseClient,
  svc: SupabaseClient,
  nowMs: number,
): Promise<AnalitikVerisi> {
  const curriculum = await getCurriculum(supabase);
  const leaderboard = await getLeaderboard(supabase);

  const [{ data: progress }, { data: attempts }, { data: subs }, { data: quizzes }, { count: bekleyenOnay }] =
    await Promise.all([
      svc.from("lesson_progress").select("user_id, lesson_id, completed_at").eq("completed", true),
      svc.from("quiz_attempts").select("user_id, quiz_id, puan, created_at"),
      svc.from("task_submissions").select("user_id, created_at"),
      svc.from("quizzes").select("id, gecme_esigi"),
      svc.from("task_submissions").select("id", { count: "exact", head: true }).eq("durum", "beklemede"),
    ]);

  const prog = (progress ?? []) as ProgressRow[];
  const att = (attempts ?? []) as AttemptRow[];
  const sub = (subs ?? []) as SubRow[];
  const esikById = new Map<string, number>();
  for (const q of (quizzes ?? []) as { id: string; gecme_esigi: number }[]) esikById.set(q.id, q.gecme_esigi);

  const uyeSayisi = leaderboard.length;

  // Üye katılımı: tamamlanan ders + son aktivite
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

  const uyeler: UyeSatiri[] = leaderboard
    .map((r) => {
      const son = sonAktivite(tarihByUser.get(r.userId) ?? []);
      const gun = gunOnce(son, nowMs);
      return {
        ad: r.gorunenAd,
        puan: r.puan,
        ders: dersByUser.get(r.userId) ?? 0,
        gun,
        aktif: gun !== null && gun <= 7,
      };
    })
    .sort((a, b) => (a.gun ?? 9999) - (b.gun ?? 9999));

  // En az tamamlanan dersler
  const tamamByLesson = new Map<string, Set<string>>();
  for (const p of prog) {
    const set = tamamByLesson.get(p.lesson_id) ?? new Set<string>();
    set.add(p.user_id);
    tamamByLesson.set(p.lesson_id, set);
  }
  const dersler: DersSatiri[] = flatten(curriculum)
    .map((f) => ({
      baslik: f.lesson.baslik,
      yer: `${f.track.ad} · ${f.module.ad}`,
      tamam: tamamByLesson.get(f.lesson.id)?.size ?? 0,
    }))
    .sort((a, b) => a.tamam - b.tamam);

  // Quiz performansı (zorlanılan üstte)
  const attByQuiz = new Map<string, AttemptRow[]>();
  for (const a of att) {
    const arr = attByQuiz.get(a.quiz_id) ?? [];
    arr.push(a);
    attByQuiz.set(a.quiz_id, arr);
  }
  const quizler: QuizSatiri[] = curriculum
    .flatMap((t) => t.modules.filter((m) => m.quiz).map((m) => ({ quiz: m.quiz!, yer: `${t.ad} · ${m.ad}` })))
    .map(({ quiz, yer }) => {
      const st = quizStat(attByQuiz.get(quiz.id) ?? [], esikById.get(quiz.id) ?? 70);
      return { baslik: quiz.baslik, yer, ...st };
    })
    .sort((a, b) => a.ortBest - b.ortBest);

  const toplamTamamlanan = prog.length;
  const totalLessons = flatten(curriculum).length;

  const dalTamamlama: DalSatiri[] = curriculum
    .map((t) => {
      const dersleri = t.modules.flatMap((m) => m.lessons);
      const done = dersleri.reduce((sum, l) => sum + (tamamByLesson.get(l.id)?.size ?? 0), 0);
      return {
        ad: t.ad,
        ikon: t.ikon,
        lessonCount: dersleri.length,
        pct: trackCompletionPct(dersleri.length, uyeSayisi, done),
      };
    })
    .filter((d) => d.lessonCount > 0);

  return {
    uyeSayisi,
    aktifSayisi: uyeler.filter((u) => u.aktif).length,
    bekleyenOnay: bekleyenOnay ?? 0,
    toplamTamamlanan,
    ortTamamlama: trackCompletionPct(totalLessons, uyeSayisi, toplamTamamlanan),
    uyeler,
    pasifler: riskliUyeler(uyeler, 14),
    dersler,
    quizler,
    dalTamamlama,
  };
}
