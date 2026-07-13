"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { submitQuiz } from "@/app/actions/quiz";
import { shuffleQuiz } from "@/lib/quiz/shuffle";
import type { Quiz, SubmitResult } from "@/lib/quiz/types";

function newSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function QuizRunner({
  quiz,
  best,
}: {
  quiz: Quiz;
  best: { puan: number; gecti: boolean } | null;
}) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Soru/şık sırasını her denemede karıştır (cevap paylaşımını zorlaştırır; puanlama ID bazlı, etkilenmez).
  const [seed, setSeed] = useState(newSeed);
  const shown = useMemo(() => shuffleQuiz(quiz, seed), [quiz, seed]);
  const router = useRouter();

  function toggle(qid: string, oid: string) {
    setSelected((prev) => {
      const set = new Set(prev[qid] ?? []);
      if (set.has(oid)) set.delete(oid);
      else set.add(oid);
      return { ...prev, [qid]: set };
    });
  }

  function submit() {
    const answers: Record<string, string[]> = {};
    for (const q of quiz.questions) answers[q.id] = Array.from(selected[q.id] ?? []);
    setError(null);
    startTransition(async () => {
      const res = await submitQuiz(quiz.id, answers);
      if (res.ok && res.result) {
        setResult(res.result);
        router.refresh(); // deneme geçmişi + en iyi puanı (server) tazele
      } else setError(res.error ?? "Quiz gönderilemedi, tekrar dene.");
    });
  }

  function retry() {
    setResult(null);
    setError(null);
    setSelected({});
    setSeed(newSeed()); // yeni denemede sırayı yeniden karıştır
  }

  const resByQuestion = new Map((result?.perQuestion ?? []).map((r) => [r.questionId, r]));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-core bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {best && !result && (
        <p className="text-sm text-muted">
          En iyi puanın: <b className="text-navy dark:text-white">%{best.puan}</b>
          {best.gecti && " · ✓ geçtin"}
        </p>
      )}

      {result && (
        <div
          className={clsx(
            "rounded-core p-4 font-display font-bold",
            result.gecti
              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
              : "bg-accent-soft text-accent-ink dark:bg-accent-dark dark:text-accent",
          )}
        >
          Puanın: %{result.puan} —{" "}
          {result.gecti ? "Geçtin!" : `Geçer not %${quiz.gecme_esigi}, tekrar deneyebilirsin.`}
          <p className="mt-1 text-xs font-normal opacity-80">
            Liderlik puanına ilk denemen sayılır; tekrar denemeler öğrenmek için serbest.
          </p>
        </div>
      )}

      {shown.questions.map((q, i) => {
        const r = resByQuestion.get(q.id);
        const correctIds = result?.correctByQuestion[q.id] ?? [];
        return (
          <div key={q.id} className="rounded-core border border-[var(--line)] p-4">
            <div className="mb-3 flex items-start gap-2 font-semibold text-navy dark:text-white">
              <span>{i + 1}.</span>
              <span>{q.metin}</span>
              {r && <span className="ml-auto">{r.dogruMu ? "✓" : "✗"}</span>}
            </div>
            <div className="space-y-2">
              {q.options.map((o) => {
                const checked = (selected[q.id] ?? new Set<string>()).has(o.id);
                const isCorrect = result ? correctIds.includes(o.id) : false;
                return (
                  <label
                    key={o.id}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                      result && isCorrect && "bg-green-50 dark:bg-green-900/20",
                      result && checked && !isCorrect && "bg-red-50 dark:bg-red-900/20",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!!result || isPending}
                      onChange={() => toggle(q.id, o.id)}
                    />
                    <span>{o.metin}</span>
                    {result && isCorrect && <span className="ml-auto text-xs text-green-600">doğru</span>}
                  </label>
                );
              })}
            </div>
            {result?.aciklamaByQuestion?.[q.id] && (
              <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink dark:bg-accent-dark dark:text-accent">
                {result.aciklamaByQuestion[q.id]}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex gap-3">
        {!result ? (
          <Button variant="accent" onClick={submit} disabled={isPending}>
            {isPending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={retry}>
            Tekrar dene
          </Button>
        )}
        <Link href="/mufredat">
          <Button variant="ghost">Müfredata dön</Button>
        </Link>
      </div>
    </div>
  );
}
