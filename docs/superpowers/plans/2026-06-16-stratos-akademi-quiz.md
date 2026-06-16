# Stratos Akademi — Quiz Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modül sonu çoktan seçmeli (çok-doğru) quizler: üye çözer, sunucuda otomatik puanlanır, sonuç+doğru cevaplar gönderimden sonra gösterilir, sınırsız tekrar; ilerlemeyi engellemez.

**Architecture:** Supabase'de `quizzes/questions/question_options/quiz_attempts` (RLS + column-level GRANT ile `dogru` istemciye kapalı). Puanlama bir Next server action'da **service-role** istemciyle yapılır (RLS bypass → doğru cevapları okur), saf TS `scoreQuiz` ile hesaplanır. Quiz UI istemci bileşeni.

**Tech Stack:** Next.js 16 (App Router, TS), Supabase (@supabase/ssr + service-role @supabase/supabase-js), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-stratos-akademi-quiz-design.md`

---

## Dosya Yapısı
```
supabase/migrations/0004_quiz.sql                 # şema + RLS + column GRANT
supabase/migrations/0005_seed_quiz.sql            # örnek quizler (DO bloklarıyla)
web/src/lib/quiz/types.ts                          # tipler
web/src/lib/quiz/score.ts                          # scoreQuiz saf fonksiyon (TDD)
web/src/lib/quiz/queries.ts                        # getQuiz (dogru'suz), getBestScore
web/src/lib/supabase/service.ts                    # service-role client (server-only)
web/src/app/actions/quiz.ts                        # submitQuiz server action
web/src/components/quiz/QuizRunner.tsx             # istemci quiz çözücü + sonuç
web/src/app/mufredat/quiz/[quizId]/page.tsx        # quiz sayfası
web/src/components/curriculum/ModuleQuizCard.tsx   # ders sayfası quiz kartı
web/src/test/quiz/score.test.ts                    # scoreQuiz testleri
web/src/test/quiz/QuizRunner.test.tsx              # quiz bileşen testi
(düzenle) web/src/lib/curriculum/types.ts          # Module'e quiz alanı
(düzenle) web/src/lib/curriculum/queries.ts        # quiz'i modüllere bağla
(düzenle) web/src/app/mufredat/[lessonId]/page.tsx # quiz kartını göster
(düzenle) web/.env.local.example                   # SUPABASE_SERVICE_ROLE_KEY
```
**Kural:** Komutlar `web/` içinden. Branch: yeni `feat/quiz`. Migration apply + service-role key girme **[İNSAN]** (Supabase panel / .env).

---

### Task 1: Quiz şeması (migration 0004)

**Files:** Create `supabase/migrations/0004_quiz.sql`

- [ ] **Step 1: Migration dosyasını yaz**

Create `supabase/migrations/0004_quiz.sql`:

```sql
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references public.modules(id) on delete cascade,
  baslik text not null,
  gecme_esigi int not null default 70,
  sira int not null default 0
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  metin text not null,
  sira int not null default 0
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  metin text not null,
  dogru boolean not null default false,
  sira int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  puan int not null,
  gecti boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_quiz on public.questions(quiz_id, sira);
create index if not exists idx_options_question on public.question_options(question_id, sira);
create index if not exists idx_attempts_user_quiz on public.quiz_attempts(user_id, quiz_id);

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "quizzes okunur" on public.quizzes for select using (auth.role() = 'authenticated');
create policy "questions okunur" on public.questions for select using (auth.role() = 'authenticated');
create policy "options okunur" on public.question_options for select using (auth.role() = 'authenticated');
create policy "attempt kendi okunur" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "attempt kendi eklenir" on public.quiz_attempts for insert with check (auth.uid() = user_id);

grant select on public.quizzes to authenticated;
grant select on public.questions to authenticated;
-- DİKKAT: dogru sütunu HARİÇ (cevaplar istemciye gönderilmez).
grant select (id, question_id, metin, sira) on public.question_options to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
```

- [ ] **Step 2: [İNSAN] Supabase'de uygula**

Supabase → SQL Editor → içeriği yapıştır → Run. Expected: "Success. No rows returned".

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add supabase/migrations/0004_quiz.sql && git commit -m "feat(quiz): schema + RLS + column-level GRANT (dogru istemciye kapalı)"
```

---

### Task 2: Quiz tipleri + scoreQuiz (TDD)

**Files:** Create `web/src/lib/quiz/types.ts`, `web/src/lib/quiz/score.ts`, `web/src/test/quiz/score.test.ts`

- [ ] **Step 1: Tipleri yaz**

Create `web/src/lib/quiz/types.ts`:

```ts
export type QuizOption = { id: string; metin: string; sira: number };
export type QuizQuestion = { id: string; metin: string; sira: number; options: QuizOption[] };
export type Quiz = {
  id: string;
  module_id: string;
  baslik: string;
  gecme_esigi: number;
  questions: QuizQuestion[];
};

// Puanlama girdileri/çıktıları
export type AnswerMap = Record<string, string[]>; // questionId -> seçilen option id'leri
export type ScorableQuestion = { id: string; correctOptionIds: string[] };
export type QuestionResult = { questionId: string; dogruMu: boolean };
export type QuizResult = { puan: number; gecti: boolean; perQuestion: QuestionResult[] };
```

- [ ] **Step 2: Başarısız testi yaz**

Create `web/src/test/quiz/score.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scoreQuiz } from "@/lib/quiz/score";
import type { ScorableQuestion, AnswerMap } from "@/lib/quiz/types";

const qs: ScorableQuestion[] = [
  { id: "q1", correctOptionIds: ["a"] },
  { id: "q2", correctOptionIds: ["x", "y"] },
];

describe("scoreQuiz", () => {
  it("hepsi doğru → %100, geçti", () => {
    const ans: AnswerMap = { q1: ["a"], q2: ["x", "y"] };
    expect(scoreQuiz(qs, ans, 70)).toEqual({
      puan: 100,
      gecti: true,
      perQuestion: [
        { questionId: "q1", dogruMu: true },
        { questionId: "q2", dogruMu: true },
      ],
    });
  });
  it("çok-doğruda eksik seçim yanlış", () => {
    const r = scoreQuiz(qs, { q1: ["a"], q2: ["x"] }, 70);
    expect(r.puan).toBe(50);
    expect(r.gecti).toBe(false);
  });
  it("çok-doğruda fazla seçim yanlış", () => {
    const r = scoreQuiz(qs, { q1: ["a"], q2: ["x", "y", "z"] }, 70);
    expect(r.perQuestion[1].dogruMu).toBe(false);
  });
  it("boş cevap yanlış sayılır", () => {
    const r = scoreQuiz(qs, {}, 70);
    expect(r.puan).toBe(0);
  });
  it("eşik tam sınırda geçer", () => {
    expect(scoreQuiz(qs, { q1: ["a"], q2: ["x"] }, 50).gecti).toBe(true);
  });
  it("soru yoksa puan 0, geçti değil", () => {
    expect(scoreQuiz([], {}, 70)).toEqual({ puan: 0, gecti: false, perQuestion: [] });
  });
});
```

- [ ] **Step 3: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/quiz/score.test.ts`
Expected: FAIL — `@/lib/quiz/score` yok.

- [ ] **Step 4: score.ts'i uygula**

Create `web/src/lib/quiz/score.ts`:

```ts
import type { AnswerMap, QuestionResult, QuizResult, ScorableQuestion } from "./types";

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: AnswerMap,
  threshold: number,
): QuizResult {
  const perQuestion: QuestionResult[] = questions.map((q) => ({
    questionId: q.id,
    dogruMu: sameSet(answers[q.id] ?? [], q.correctOptionIds),
  }));
  const total = questions.length;
  const correct = perQuestion.filter((r) => r.dogruMu).length;
  const puan = total ? Math.round((correct / total) * 100) : 0;
  return { puan, gecti: total > 0 && puan >= threshold, perQuestion };
}
```

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/quiz/score.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/lib/quiz/types.ts web/src/lib/quiz/score.ts web/src/test/quiz/score.test.ts && git commit -m "feat(quiz): types + scoreQuiz pure function (TDD)"
```

---

### Task 3: Service-role client + quiz sorguları

**Files:** Create `web/src/lib/supabase/service.ts`, `web/src/lib/quiz/queries.ts`; Modify `web/.env.local.example`

- [ ] **Step 1: Service-role client'ı yaz**

Create `web/src/lib/supabase/service.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

// SADECE sunucuda kullanılır (server action). Servis anahtarı RLS'i bypass eder.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 2: .env.local.example'a servis anahtarını ekle**

`web/.env.local.example` dosyasının sonuna ekle:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```

- [ ] **Step 3: [İNSAN] Gerçek servis anahtarını .env.local'e ekle**

Supabase → Project Settings → API → **service_role** **secret** anahtarını kopyala; `web/.env.local`'e ekle:
`SUPABASE_SERVICE_ROLE_KEY=eyJ...` (server-only; `NEXT_PUBLIC_` DEĞİL; gitignored). Dev sunucusunu yeniden başlat.

- [ ] **Step 4: Quiz sorgularını yaz**

Create `web/src/lib/quiz/queries.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quiz, QuizOption, QuizQuestion } from "./types";

export async function getQuiz(supabase: SupabaseClient, quizId: string): Promise<Quiz | null> {
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id,module_id,baslik,gecme_esigi")
    .eq("id", quizId)
    .single();
  if (!quiz) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id,metin,sira")
    .eq("quiz_id", quizId)
    .order("sira");

  const qids = (questions ?? []).map((q: { id: string }) => q.id);
  const { data: options } = qids.length
    ? await supabase
        .from("question_options")
        .select("id,question_id,metin,sira") // dogru YOK
        .in("question_id", qids)
        .order("sira")
    : { data: [] };

  const byQuestion = new Map<string, QuizOption[]>();
  for (const row of (options ?? []) as (QuizOption & { question_id: string })[]) {
    const { question_id, ...opt } = row;
    const arr = byQuestion.get(question_id) ?? [];
    arr.push(opt);
    byQuestion.set(question_id, arr);
  }

  const builtQuestions: QuizQuestion[] = (questions ?? []).map(
    (q: { id: string; metin: string; sira: number }) => ({
      ...q,
      options: byQuestion.get(q.id) ?? [],
    }),
  );

  return { ...(quiz as Omit<Quiz, "questions">), questions: builtQuestions };
}

export async function getBestScore(
  supabase: SupabaseClient,
  userId: string,
  quizId: string,
): Promise<{ puan: number; gecti: boolean } | null> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("puan,gecti")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("puan", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { puan: number; gecti: boolean } | null) ?? null;
}
```

- [ ] **Step 5: Derleme**

Run: `cd web && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 6: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/lib/supabase/service.ts web/src/lib/quiz/queries.ts web/.env.local.example && git commit -m "feat(quiz): service-role client + quiz queries (answers excluded)"
```

---

### Task 4: submitQuiz server action

**Files:** Create `web/src/app/actions/quiz.ts`

- [ ] **Step 1: Action'ı yaz**

Create `web/src/app/actions/quiz.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreQuiz } from "@/lib/quiz/score";
import type { AnswerMap, QuizResult, ScorableQuestion } from "@/lib/quiz/types";

export type SubmitResult = QuizResult & { correctByQuestion: Record<string, string[]> };

export async function submitQuiz(
  quizId: string,
  answers: AnswerMap,
): Promise<{ ok: boolean; result?: SubmitResult }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const svc = createServiceClient();
  const { data: quiz } = await svc.from("quizzes").select("gecme_esigi").eq("id", quizId).single();
  if (!quiz) return { ok: false };

  const { data: questions } = await svc.from("questions").select("id").eq("quiz_id", quizId);
  const qids = (questions ?? []).map((q: { id: string }) => q.id);
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

  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    quiz_id: quizId,
    puan: result.puan,
    gecti: result.gecti,
  });

  return { ok: true, result: { ...result, correctByQuestion } };
}
```

- [ ] **Step 2: Derleme**

Run: `cd web && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/app/actions/quiz.ts && git commit -m "feat(quiz): submitQuiz server action (service-role grading)"
```

---

### Task 5: QuizRunner bileşeni + quiz sayfası (TDD)

**Files:** Create `web/src/components/quiz/QuizRunner.tsx`, `web/src/app/mufredat/quiz/[quizId]/page.tsx`, `web/src/test/quiz/QuizRunner.test.tsx`

- [ ] **Step 1: Başarısız bileşen testi yaz**

Create `web/src/test/quiz/QuizRunner.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import type { Quiz } from "@/lib/quiz/types";

vi.mock("@/app/actions/quiz", () => ({
  submitQuiz: vi.fn(async () => ({
    ok: true,
    result: {
      puan: 100,
      gecti: true,
      perQuestion: [{ questionId: "q1", dogruMu: true }],
      correctByQuestion: { q1: ["o1"] },
    },
  })),
}));

const quiz: Quiz = {
  id: "z1",
  module_id: "m1",
  baslik: "Test Quiz",
  gecme_esigi: 70,
  questions: [
    { id: "q1", metin: "Soru 1", sira: 1, options: [
      { id: "o1", metin: "A", sira: 1 },
      { id: "o2", metin: "B", sira: 2 },
    ] },
  ],
};

describe("QuizRunner", () => {
  it("şık seçip gönderince puanı gösterir", async () => {
    render(<QuizRunner quiz={quiz} best={null} />);
    await userEvent.click(screen.getByText("A"));
    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));
    expect(await screen.findByText(/Puanın: %100/)).toBeInTheDocument();
    expect(screen.getByText(/Geçtin/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/quiz/QuizRunner.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: QuizRunner'ı uygula**

Create `web/src/components/quiz/QuizRunner.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { submitQuiz, type SubmitResult } from "@/app/actions/quiz";
import type { Quiz } from "@/lib/quiz/types";

export function QuizRunner({
  quiz,
  best,
}: {
  quiz: Quiz;
  best: { puan: number; gecti: boolean } | null;
}) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const res = await submitQuiz(quiz.id, answers);
      if (res.ok && res.result) setResult(res.result);
    });
  }

  function retry() {
    setResult(null);
    setSelected({});
  }

  const resByQuestion = new Map((result?.perQuestion ?? []).map((r) => [r.questionId, r]));

  return (
    <div className="space-y-6">
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
              : "bg-gold-soft text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]",
          )}
        >
          Puanın: %{result.puan} —{" "}
          {result.gecti ? "Geçtin! 🎉" : `Geçer not %${quiz.gecme_esigi}, tekrar deneyebilirsin.`}
        </div>
      )}

      {quiz.questions.map((q, i) => {
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
          </div>
        );
      })}

      <div className="flex gap-3">
        {!result ? (
          <Button variant="gold" onClick={submit} disabled={isPending}>
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
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/quiz/QuizRunner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Quiz sayfasını yaz**

Create `web/src/app/mufredat/quiz/[quizId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { getQuiz, getBestScore } from "@/lib/quiz/queries";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quiz = await getQuiz(supabase, quizId);
  if (!quiz) notFound();

  const best = user ? await getBestScore(supabase, user.id, quizId) : null;

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()}>
      <div className="mb-5">
        <Eyebrow>Modül Quizi</Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          {quiz.baslik}
        </h1>
      </div>
      <QuizRunner quiz={quiz} best={best} />
    </AppShell>
  );
}
```

- [ ] **Step 6: Derleme + tüm testler**

Run: `cd web && npm run build && npm test`
Expected: Build `Compiled successfully`; testler PASS.

- [ ] **Step 7: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/components/quiz "web/src/app/mufredat/quiz" web/src/test/quiz/QuizRunner.test.tsx && git commit -m "feat(quiz): QuizRunner component and quiz page (TDD)"
```

---

### Task 6: Müfredata quiz bağlama + ders sayfası kartı

**Files:** Modify `web/src/lib/curriculum/types.ts`, `web/src/lib/curriculum/queries.ts`, `web/src/app/mufredat/[lessonId]/page.tsx`; Create `web/src/components/curriculum/ModuleQuizCard.tsx`

- [ ] **Step 1: Module tipine quiz alanı ekle**

`web/src/lib/curriculum/types.ts` içindeki `Module` tipini şu hale getir (mevcut alanlar + `quiz`):

```ts
export type Module = {
  id: string;
  ad: string;
  aciklama: string | null;
  sira: number;
  quiz: { id: string; baslik: string } | null;
  lessons: Lesson[];
};
```

- [ ] **Step 2: getCurriculum'a quiz çekme ekle**

`web/src/lib/curriculum/queries.ts` içindeki `getCurriculum` fonksiyonunu şu içerikle değiştir:

```ts
export async function getCurriculum(supabase: SupabaseClient): Promise<Curriculum> {
  const [{ data: tracks }, { data: modules }, { data: lessons }, { data: quizzes }] =
    await Promise.all([
      supabase.from("tracks").select("id,slug,ad,aciklama,ikon,sira").order("sira"),
      supabase.from("modules").select("id,track_id,ad,aciklama,sira").order("sira"),
      supabase
        .from("lessons")
        .select("id,module_id,baslik,youtube_video_id,aciklama,sure_sn,sira")
        .order("sira"),
      supabase.from("quizzes").select("id,module_id,baslik"),
    ]);

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const row of (lessons ?? []) as LessonRow[]) {
    const { module_id, ...lesson } = row;
    const arr = lessonsByModule.get(module_id) ?? [];
    arr.push(lesson);
    lessonsByModule.set(module_id, arr);
  }

  const quizByModule = new Map<string, { id: string; baslik: string }>();
  for (const row of (quizzes ?? []) as { id: string; module_id: string; baslik: string }[]) {
    quizByModule.set(row.module_id, { id: row.id, baslik: row.baslik });
  }

  const modulesByTrack = new Map<string, Module[]>();
  for (const row of (modules ?? []) as ModuleRow[]) {
    const { track_id, ...rest } = row;
    const module: Module = {
      ...rest,
      quiz: quizByModule.get(rest.id) ?? null,
      lessons: lessonsByModule.get(rest.id) ?? [],
    };
    const arr = modulesByTrack.get(track_id) ?? [];
    arr.push(module);
    modulesByTrack.set(track_id, arr);
  }

  return ((tracks ?? []) as TrackRow[]).map((t) => ({
    ...t,
    modules: modulesByTrack.get(t.id) ?? [],
  }));
}
```

Not: `ModuleRow` tipi `Omit<Module, "lessons">` idi; artık `quiz` de eklendiğinden `ModuleRow`'u şu şekilde güncelle (dosyanın başındaki tip tanımı):

```ts
type ModuleRow = Omit<Module, "lessons" | "quiz"> & { track_id: string };
```

- [ ] **Step 3: ModuleQuizCard'ı yaz**

Create `web/src/components/curriculum/ModuleQuizCard.tsx`:

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function ModuleQuizCard({
  quizId,
  baslik,
  best,
}: {
  quizId: string;
  baslik: string;
  best: { puan: number; gecti: boolean } | null;
}) {
  return (
    <Card className="mt-6 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a6d12] dark:text-[#ffd54a]">
            📝 Modül Quizi
          </span>
          <h3 className="mt-1 font-display text-lg font-bold text-navy dark:text-white">{baslik}</h3>
          {best && (
            <p className="mt-0.5 text-sm text-muted">
              En iyi: %{best.puan}
              {best.gecti ? " · ✓ geçtin" : ""}
            </p>
          )}
        </div>
        <Link
          href={`/mufredat/quiz/${quizId}`}
          className="rounded-full bg-gold px-5 py-2.5 font-display text-sm font-semibold text-navy"
        >
          {best ? "Tekrar çöz" : "Başla"}
        </Link>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Ders sayfasında quiz kartını göster**

`web/src/app/mufredat/[lessonId]/page.tsx` dosyasını şu içerikle değiştir:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LessonSection } from "@/components/curriculum/LessonSection";
import { ModuleQuizCard } from "@/components/curriculum/ModuleQuizCard";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { getBestScore } from "@/lib/quiz/queries";
import { flatten, findNext } from "@/lib/curriculum/progress";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curriculum = await getCurriculum(supabase);
  const found = flatten(curriculum).find((f) => f.lesson.id === lessonId);
  if (!found) notFound();

  const completed = user ? await getCompletedLessonIds(supabase, user.id) : new Set<string>();
  const next = findNext(curriculum, lessonId);
  const quiz = found.module.quiz;
  const quizBest = quiz && user ? await getBestScore(supabase, user.id, quiz.id) : null;

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()}>
      <div className="mb-4">
        <Eyebrow>
          {found.track.ad} · {found.module.ad}
        </Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          {found.lesson.baslik}
        </h1>
      </div>

      <LessonSection
        lessonId={found.lesson.id}
        videoId={found.lesson.youtube_video_id}
        initiallyCompleted={completed.has(found.lesson.id)}
        nextHref={next ? `/mufredat/${next.lesson.id}` : null}
      />

      {found.lesson.aciklama && (
        <p className="mt-6 max-w-[65ch] whitespace-pre-line text-[15px] leading-7 text-[#46526b] dark:text-[#9fb0c9]">
          {found.lesson.aciklama}
        </p>
      )}

      {quiz && <ModuleQuizCard quizId={quiz.id} baslik={quiz.baslik} best={quizBest} />}
    </AppShell>
  );
}
```

- [ ] **Step 5: Derleme + tüm testler**

Run: `cd web && npm run build && npm test`
Expected: Build `Compiled successfully`; testler PASS (mevcut müfredat testleri `Module`'e `quiz` ekledikleri için kırılmamalı — `CurriculumTree.test.tsx` modülleri `quiz` alanı olmadan kuruyor; TypeScript opsiyonel olmayan `quiz` alanını test verisinde zorunlu kılar, bu yüzden testteki modüllere `quiz: null` ekle).

Bu adımda `web/src/test/curriculum/CurriculumTree.test.tsx` ve `web/src/test/curriculum/progress.test.ts` içindeki modül nesnelerine `quiz: null` ekle. CurriculumTree testindeki modül:

```tsx
      { id: "m1", ad: "Drone Temelleri", aciklama: null, sira: 1, quiz: null, lessons: [
```

progress testindeki iki modül (`m1`, `m2`) için de `L` yardımcı fonksiyonunun altındaki `curriculum` nesnesinde:

```ts
      { id: "m1", ad: "M1", aciklama: null, sira: 1, quiz: null, lessons: [L("a", 1), L("b", 2)] },
      { id: "m2", ad: "M2", aciklama: null, sira: 2, quiz: null, lessons: [L("c", 1)] },
```

Tekrar çalıştır: `cd web && npm test` → tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/lib/curriculum "web/src/app/mufredat/[lessonId]/page.tsx" web/src/components/curriculum/ModuleQuizCard.tsx web/src/test/curriculum && git commit -m "feat(quiz): modüllere quiz bağla + ders sayfasında Modül Quizi kartı"
```

---

### Task 7: Örnek quiz tohumu (migration 0005) + canlı doğrulama

**Files:** Create `supabase/migrations/0005_seed_quiz.sql`

- [ ] **Step 1: Seed migration'ı yaz**

Create `supabase/migrations/0005_seed_quiz.sql`:

```sql
-- Örnek quizler. Yalnız bir kez, quiz tabloları boşken çalıştırın.

do $$
declare v_module uuid; v_quiz uuid; v_q uuid;
begin
  select id into v_module from public.modules where ad = 'Drone Temelleri' limit 1;
  if v_module is null then raise notice 'Drone Temelleri modülü yok, atlanıyor'; return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira)
    values (v_module, 'Drone Temelleri Quizi', 70, 1) returning id into v_quiz;

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Bir quadcopter''da kaç motor bulunur?', 1) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, '2', false, 1), (v_q, '3', false, 2), (v_q, '4', true, 3), (v_q, '6', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Aşağıdakilerden hangileri bir drone''un temel bileşenlerindendir? (birden çok)', 2) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Motor', true, 1), (v_q, 'Uçuş kontrol kartı', true, 2), (v_q, 'Pervane', true, 3), (v_q, 'Klavye', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'İtki (thrust) kuvveti drone''da neyi sağlar?', 3) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Havalanma ve havada kalma', true, 1), (v_q, 'Renk değişimi', false, 2),
    (v_q, 'Veri depolama', false, 3), (v_q, 'Ses üretimi', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Pervanelerin dönüş yönü (CW/CCW) drone dengesi için önemlidir.', 4) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Doğru', true, 1), (v_q, 'Yanlış', false, 2);
end $$;

do $$
declare v_module uuid; v_quiz uuid; v_q uuid;
begin
  select id into v_module from public.modules where ad = 'Temel Elektronik' limit 1;
  if v_module is null then raise notice 'Temel Elektronik modülü yok, atlanıyor'; return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira)
    values (v_module, 'Temel Elektronik Quizi', 70, 1) returning id into v_quiz;

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Ohm yasası neyi tanımlar?', 1) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Gerilim, akım ve direnç ilişkisini', true, 1), (v_q, 'Işık hızını', false, 2),
    (v_q, 'Sıcaklığı', false, 3), (v_q, 'Frekansı', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Aşağıdakilerden hangileri gerilim birimidir? (birden çok)', 2) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Volt (V)', true, 1), (v_q, 'Milivolt (mV)', true, 2), (v_q, 'Amper (A)', false, 3), (v_q, 'Ohm (Ω)', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'DC (doğru akım) için doğru olan nedir?', 3) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Tek yönde akar', true, 1), (v_q, 'Sürekli yön değiştirir', false, 2),
    (v_q, 'Ölçülemez', false, 3), (v_q, 'Sadece şehir şebekesinde bulunur', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Multimetre ile aşağıdakilerden hangileri ölçülebilir? (birden çok)', 4) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Gerilim', true, 1), (v_q, 'Direnç', true, 2), (v_q, 'Akım', true, 3), (v_q, 'Ağırlık', false, 4);
end $$;
```

- [ ] **Step 2: [İNSAN] Supabase'de uygula**

Supabase → SQL Editor → içeriği yapıştır → Run. Expected: "Success".
Doğrulama:
```sql
select q.baslik, count(distinct qs.id) as soru
from public.quizzes q
left join public.questions qs on qs.quiz_id = q.id
group by q.baslik;
```
Expected: "Drone Temelleri Quizi"=4, "Temel Elektronik Quizi"=4.

- [ ] **Step 3: [İNSAN] Canlı uçtan uca doğrula**

`web/.env.local`'de `SUPABASE_SERVICE_ROLE_KEY` ayarlı olmalı (Task 3 Step 3). Dev'i yeniden başlat: `cd web && npm run dev -- -p 3000`.
- Giriş → `/mufredat` → "Ortak Temel → Drone Temelleri" altındaki bir derse gir → altta **"📝 Modül Quizi"** kartı → **Başla**.
- Soruları işaretle → **Gönder** → puan + doğru/yanlış işaretleri + doğru cevaplar görünür.
- Yanlış cevap verip gör; **Tekrar dene** ile yeniden çöz; en iyi puan kartta görünür.
- Önemli güvenlik kontrolü: Quiz sayfasında tarayıcı DevTools → Network'te `question_options` isteğinde **`dogru` alanı OLMAMALI** (yalnız submit sonrası action yanıtında doğru cevaplar gelir).

Expected: Hepsi beklendiği gibi.

- [ ] **Step 4: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add supabase/migrations/0005_seed_quiz.sql && git commit -m "feat(quiz): örnek quiz tohumu (Drone Temelleri, Temel Elektronik)"
```

---

## Plan Tamamlandı — Sonraki Adımlar

Bu plan modül sonu quizlerini ekler. Sonraki planlar: **Tam Dashboard** (istatistik/rozet/streak kartları), **Admin paneli** (içerik + quiz CRUD), v2 (pratik görev, rozet, liderlik).
