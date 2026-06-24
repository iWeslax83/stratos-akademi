"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreQuiz } from "@/lib/quiz/score";
import type { AnswerMap, ScorableQuestion, SubmitResult } from "@/lib/quiz/types";

export async function submitQuiz(
  quizId: string,
  answers: AnswerMap,
): Promise<{ ok: boolean; error?: string; result?: SubmitResult }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { ok: false, error: "Sunucu yapılandırması eksik (servis anahtarı)." };
    }

    // NOT: Burada getUser çağırmıyoruz. getUser oturum yenilemesi tetikleyip server action
    // sırasında çerez kalıcılığı sorunu yarattığından ("refresh token already used"), kullanıcı
    // doğrulaması proxy + RLS'e bırakılır. user_id'yi DB tarafı `default auth.uid()` doldurur.
    const svc = createServiceClient();
    const { data: quiz, error: quizErr } = await svc
      .from("quizzes")
      .select("gecme_esigi")
      .eq("id", quizId)
      .single();
    if (!quiz) {
      console.error("submitQuiz: quiz bulunamadı", { quizId, quizErr });
      return { ok: false, error: "Quiz bulunamadı." };
    }

    const { data: questions } = await svc.from("questions").select("id").eq("quiz_id", quizId);
    const qids = (questions ?? []).map((q: { id: string }) => q.id);

    // Açıklamalar best-effort: aciklama kolonu yoksa (migration öncesi) boş kalır,
    // puanlamayı (yukarıdaki kritik "id" sorgusu) ETKİLEMEZ.
    const aciklamaByQuestion: Record<string, string | null> = {};
    if (qids.length) {
      const { data: ar } = await svc.from("questions").select("id, aciklama").in("id", qids);
      for (const q of (ar ?? []) as { id: string; aciklama: string | null }[]) {
        aciklamaByQuestion[q.id] = q.aciklama;
      }
    }
    const { data: opts } = qids.length
      ? await svc.from("question_options").select("id,question_id,dogru").in("question_id", qids)
      : { data: [] };

    const correctByQuestion: Record<string, string[]> = {};
    for (const id of qids) correctByQuestion[id] = [];
    for (const o of (opts ?? []) as { id: string; question_id: string; dogru: boolean }[]) {
      if (o.dogru) correctByQuestion[o.question_id].push(o.id);
    }

    const scorable: ScorableQuestion[] = qids.map((id: string) => ({
      id,
      correctOptionIds: correctByQuestion[id],
    }));
    const result = scoreQuiz(scorable, answers, (quiz as { gecme_esigi: number }).gecme_esigi);

    // Attempt kaydı. GÜVENLİ YOL (0022 uygulandıysa): my_uid() RPC ile JWT'den doğrulanmış
    // user_id alınır ve attempt service_role ile eklenir (üye puanı doğrudan REST'e yazamaz).
    // GERİ UYUMLU YOL (0022 öncesi: my_uid yok / service insert yetkisi yok): eski davranış —
    // authenticated client + `default auth.uid()`. Böylece migration uygulanana kadar quiz
    // gönderimi bozulmaz.
    const supabase = await createClient();
    let inserted = false;
    const { data: uid, error: uidErr } = await supabase.rpc("my_uid");
    if (!uidErr && uid) {
      const { error: svcInsErr } = await svc.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: uid,
        puan: result.puan,
        gecti: result.gecti,
      });
      if (svcInsErr) {
        console.error("submitQuiz: service_role insert başarısız, fallback:", svcInsErr);
      } else {
        inserted = true;
      }
    }
    if (!inserted) {
      const { error: insertError } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        puan: result.puan,
        gecti: result.gecti,
      });
      if (insertError) {
        console.error("submitQuiz: quiz_attempts insert hatası:", insertError);
        return { ok: false, error: "Sonuç kaydedilemedi." };
      }
    }

    return { ok: true, result: { ...result, correctByQuestion, aciklamaByQuestion } };
  } catch (e) {
    console.error("submitQuiz beklenmeyen hata:", e);
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}
