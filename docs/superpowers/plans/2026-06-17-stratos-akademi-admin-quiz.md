# Admin Quiz CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adminlerin bir modülün quiz'ini (sorular + şıklar + doğru cevaplar) tek sayfa iç içe editörden yönetmesi.

**Architecture:** quiz tablolarına admin yazma RLS (`is_admin()` 0010'dan); `dogru` kolonu service_role ile sunucu tarafında okunur; granular server action'lar (client her aksiyon sonrası `router.refresh()`); modül altında tek editör sayfası.

**Tech Stack:** Next.js 16 (App Router, RSC + Server Actions), TypeScript, Tailwind v3, Supabase (RLS + service_role).

**Spec:** `docs/superpowers/specs/2026-06-17-stratos-akademi-admin-quiz-design.md`

---

## Çalışma kuralları (executor için)

- Komutlar `web/` içinde. `@/` → `web/src/`. Migration'ı **kullanıcı** SQL editörde uygular.
- Mevcut: `Card`/`Button`(type HTML attr geçer)/`Eyebrow`, `AppShell`(isAdmin), `AdminBreadcrumb`, `DeleteButton` (onDelete + uyari, onaylı), `createClient` (`@/lib/supabase/server`), `createServiceClient` (`@/lib/supabase/service`). `is_admin()` SQL fonksiyonu mevcut (0010).
- Tailwind: `navy`, `gold`, `muted`, `rounded-core`, `var(--line)`. Servis anahtarı asla komut satırına/commit'e konmaz.
- Bu özellikte **yeni saf fonksiyon yok** → yeni birim testi yok; doğrulama `tsc` + `npm run test` (mevcut 69 yeşil kalır) + build + elle e2e.

## Dosya Yapısı

**Yeni:**
- `supabase/migrations/0011_admin_quiz_rls.sql`
- `web/src/lib/admin/quiz-queries.ts` — `getQuizForAdmin` (service_role)
- `web/src/app/actions/admin-quiz.ts` — 10 server action
- `web/src/components/admin/ActionButton.tsx` (client) — onaysız ekle/oluştur + refresh
- `web/src/components/admin/QuizMetaForm.tsx` (client)
- `web/src/components/admin/OptionRow.tsx` (client)
- `web/src/components/admin/QuestionEditor.tsx` (client)
- `web/src/app/admin/mufredat/[trackId]/[moduleId]/quiz/page.tsx`

**Değişen:**
- `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx` — "Quiz'i düzenle" linki

---

## Task 0: Dal aç

- [ ] **Step 1**
```bash
cd /home/weslax83/stratos-akademi && git checkout -b feat/admin-quiz && git branch --show-current
```
Expected: `feat/admin-quiz`

---

## Task 1: RLS migration (0011)

**Files:** Create `supabase/migrations/0011_admin_quiz_rls.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0011_admin_quiz_rls.sql`:
```sql
-- Quiz tablolarına admin yazma (is_admin() 0010'da tanımlı). Mevcut SELECT
-- politikaları durur; OR'lanır. question_options.dogru SELECT'i üyelere kapalı
-- kalır (kolon grant'i değişmez); admin editörü dogru'yu service_role ile okur.
create policy "quizzes admin yazar" on public.quizzes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "questions admin yazar" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "options admin yazar" on public.question_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tablo düzeyi DML grant'i dogru kolonunu da kapsar; yazma yalnız is_admin() ile.
grant insert, update, delete on public.quizzes to authenticated;
grant insert, update, delete on public.questions to authenticated;
grant insert, update, delete on public.question_options to authenticated;
```

- [ ] **Step 2: Kullanıcı uygular**

Kullanıcıdan iste: bu dosyayı Supabase SQL editöründe çalıştırsın ("Success. No rows returned" beklenir).

- [ ] **Step 3: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0011_admin_quiz_rls.sql && git commit -m "feat(admin): quiz tabloları admin yazma RLS (0011)"
```

---

## Task 2: getQuizForAdmin (quiz-queries.ts)

**Files:** Create `web/src/lib/admin/quiz-queries.ts`

- [ ] **Step 1: Implementasyon**

`web/src/lib/admin/quiz-queries.ts`:
```ts
import { createServiceClient } from "@/lib/supabase/service";

export type AdminOption = { id: string; metin: string; dogru: boolean; sira: number };
export type AdminQuestion = { id: string; metin: string; sira: number; options: AdminOption[] };
export type AdminQuiz = { id: string; baslik: string; gecme_esigi: number; questions: AdminQuestion[] };

// Modülün quiz'ini doğru cevaplar DAHİL (service_role) okur. Quiz yoksa null.
// service_role anahtarı yoksa hata fırlatır (çağıran sayfa yakalar).
export async function getQuizForAdmin(moduleId: string): Promise<AdminQuiz | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Servis anahtarı eksik (SUPABASE_SERVICE_ROLE_KEY).");
  }
  const svc = createServiceClient();

  const { data: quiz } = await svc
    .from("quizzes")
    .select("id, baslik, gecme_esigi")
    .eq("module_id", moduleId)
    .maybeSingle();
  if (!quiz) return null;

  const { data: questions } = await svc
    .from("questions")
    .select("id, metin, sira")
    .eq("quiz_id", quiz.id)
    .order("sira");
  const qids = (questions ?? []).map((q: { id: string }) => q.id);

  const { data: opts } = qids.length
    ? await svc
        .from("question_options")
        .select("id, question_id, metin, dogru, sira")
        .in("question_id", qids)
        .order("sira")
    : { data: [] };

  const byQuestion = new Map<string, AdminOption[]>();
  for (const o of (opts ?? []) as (AdminOption & { question_id: string })[]) {
    const { question_id, ...rest } = o;
    const arr = byQuestion.get(question_id) ?? [];
    arr.push(rest);
    byQuestion.set(question_id, arr);
  }

  return {
    id: quiz.id,
    baslik: quiz.baslik,
    gecme_esigi: quiz.gecme_esigi,
    questions: (questions ?? []).map((q: { id: string; metin: string; sira: number }) => ({
      ...q,
      options: byQuestion.get(q.id) ?? [],
    })),
  };
}
```

- [ ] **Step 2: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/admin/quiz-queries.ts && git commit -m "feat(admin): getQuizForAdmin (service_role, dogru dahil)"
```

---

## Task 3: Server actions (admin-quiz.ts)

**Files:** Create `web/src/app/actions/admin-quiz.ts`

- [ ] **Step 1: Implementasyon**

`web/src/app/actions/admin-quiz.ts`:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- QUIZ ----
export async function createQuiz(moduleId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quizzes")
      .insert({ module_id: moduleId, baslik: "Modül Quizi", gecme_esigi: 70, sira: 0 });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Bu modülde zaten bir quiz var." };
      return { ok: false, error: errMsg(error) };
    }
    return { ok: true };
  } catch (e) { console.error("createQuiz:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateQuizMeta(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const esik = Math.max(0, Math.min(100, intOr(fd, "gecme_esigi", 70)));
    const supabase = await createClient();
    const { error } = await supabase.from("quizzes").update({ baslik, gecme_esigi: esik }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateQuizMeta:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteQuiz:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- QUESTION ----
export async function createQuestion(quizId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("questions").insert({ quiz_id: quizId, metin: "", sira: 0 });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateQuestion(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const metin = str(fd, "metin");
    if (!id) return { ok: false, error: "id eksik." };
    if (!metin) return { ok: false, error: "Soru metni zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("questions")
      .update({ metin, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteQuestion:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- OPTION ----
export async function createOption(questionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("question_options")
      .insert({ question_id: questionId, metin: "", dogru: false, sira: 0 });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateOption(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const metin = str(fd, "metin");
    if (!id) return { ok: false, error: "id eksik." };
    if (!metin) return { ok: false, error: "Şık metni zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("question_options")
      .update({ metin, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function toggleOption(id: string, dogru: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("question_options").update({ dogru }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("toggleOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteOption(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("question_options").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteOption:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
```

- [ ] **Step 2: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/actions/admin-quiz.ts && git commit -m "feat(admin): quiz CRUD server action'ları (granular)"
```

---

## Task 4: ActionButton + QuizMetaForm

**Files:** Create `web/src/components/admin/ActionButton.tsx`, `web/src/components/admin/QuizMetaForm.tsx`

- [ ] **Step 1: ActionButton (client)**

`web/src/components/admin/ActionButton.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ActionButton({
  onAction,
  children,
  variant = "ghost",
}: {
  onAction: () => Promise<{ ok: boolean; error?: string }>;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "gold";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function click() {
    start(async () => {
      const r = await onAction();
      if (!r.ok) window.alert(r.error ?? "İşlem başarısız");
      else router.refresh();
    });
  }

  return (
    <Button variant={variant} type="button" onClick={click} disabled={pending}>
      {pending ? "…" : children}
    </Button>
  );
}
```

- [ ] **Step 2: QuizMetaForm (client)**

`web/src/components/admin/QuizMetaForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateQuizMeta } from "@/app/actions/admin-quiz";

export function QuizMetaForm({
  quiz,
}: {
  quiz: { id: string; baslik: string; gecme_esigi: number };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await updateQuizMeta(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={quiz.id} />
      <label className="block min-w-[200px] flex-1">
        <span className="mb-1 block text-xs font-semibold text-muted">Başlık</span>
        <input
          name="baslik"
          defaultValue={quiz.baslik}
          required
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Geçme eşiği (%)</span>
        <input
          name="gecme_esigi"
          type="number"
          min={0}
          max={100}
          defaultValue={String(quiz.gecme_esigi)}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <Button variant="gold" disabled={pending}>{pending ? "…" : "Kaydet"}</Button>
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/ActionButton.tsx web/src/components/admin/QuizMetaForm.tsx && git commit -m "feat(admin): ActionButton + QuizMetaForm bileşenleri"
```

---

## Task 5: OptionRow + QuestionEditor

**Files:** Create `web/src/components/admin/OptionRow.tsx`, `web/src/components/admin/QuestionEditor.tsx`

- [ ] **Step 1: OptionRow (client)**

`web/src/components/admin/OptionRow.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOption, toggleOption, deleteOption } from "@/app/actions/admin-quiz";

export function OptionRow({
  option,
}: {
  option: { id: string; metin: string; dogru: boolean; sira: number };
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateOption(fd);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function toggle() {
    start(async () => {
      const r = await toggleOption(option.id, !option.dogru);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function del() {
    start(async () => {
      const r = await deleteOption(option.id);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }

  return (
    <form onSubmit={saveText} className="flex items-center gap-2">
      <input type="hidden" name="id" value={option.id} />
      <input
        type="checkbox"
        checked={option.dogru}
        onChange={toggle}
        disabled={pending}
        title="Doğru cevap"
        className="h-4 w-4"
      />
      <input
        name="metin"
        defaultValue={option.metin}
        placeholder="Şık metni"
        className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-navy outline-none focus:border-gold dark:text-white"
      />
      <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
        Kaydet
      </button>
      <button type="button" onClick={del} disabled={pending} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Sil
      </button>
    </form>
  );
}
```

- [ ] **Step 2: QuestionEditor (client)**

`web/src/components/admin/QuestionEditor.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuestion, deleteQuestion, createOption } from "@/app/actions/admin-quiz";
import { OptionRow } from "./OptionRow";
import { ActionButton } from "./ActionButton";

type Q = {
  id: string;
  metin: string;
  sira: number;
  options: { id: string; metin: string; dogru: boolean; sira: number }[];
};

export function QuestionEditor({ question, index }: { question: Q; index: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateQuestion(fd);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function del() {
    if (!window.confirm("Bu soruyu ve şıklarını silmek istediğine emin misin?")) return;
    start(async () => {
      const r = await deleteQuestion(question.id);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }

  const hasCorrect = question.options.some((o) => o.dogru);

  return (
    <div className="rounded-core border border-[var(--line)] p-4">
      <form onSubmit={saveText} className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted">{index + 1}.</span>
        <input type="hidden" name="id" value={question.id} />
        <input
          name="metin"
          defaultValue={question.metin}
          placeholder="Soru metni"
          className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-gold dark:text-white"
        />
        <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
          Kaydet
        </button>
        <button type="button" onClick={del} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          Sil
        </button>
      </form>

      <div className="mt-3 space-y-2 pl-6">
        {question.options.map((o) => (
          <OptionRow key={o.id} option={o} />
        ))}
        <div className="flex items-center gap-3 pt-1">
          <ActionButton onAction={createOption.bind(null, question.id)}>+ Şık ekle</ActionButton>
          {!hasCorrect && <span className="text-xs font-semibold text-amber-600">doğru şık seçilmedi</span>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/OptionRow.tsx web/src/components/admin/QuestionEditor.tsx && git commit -m "feat(admin): OptionRow + QuestionEditor bileşenleri"
```

---

## Task 6: Quiz editör sayfası + modül sayfası linki

**Files:** Create `web/src/app/admin/mufredat/[trackId]/[moduleId]/quiz/page.tsx` · Modify `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`

- [ ] **Step 1: Quiz editör sayfası**

`web/src/app/admin/mufredat/[trackId]/[moduleId]/quiz/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { QuizMetaForm } from "@/components/admin/QuizMetaForm";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { ActionButton } from "@/components/admin/ActionButton";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getQuizForAdmin, type AdminQuiz } from "@/lib/admin/quiz-queries";
import { createQuiz, createQuestion, deleteQuiz } from "@/app/actions/admin-quiz";

export const dynamic = "force-dynamic";

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ trackId: string; moduleId: string }>;
}) {
  const { trackId, moduleId } = await params;
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

  let quiz: AdminQuiz | null = null;
  let loadError = false;
  try {
    quiz = await getQuizForAdmin(moduleId);
  } catch (e) {
    console.error("getQuizForAdmin:", e);
    loadError = true;
  }

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: modul.ad, href: `/admin/mufredat/${trackId}/${moduleId}` },
          { label: "Quiz" },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {modul.ad} · Quiz
      </h1>

      {loadError ? (
        <Card className="mt-5 p-6">
          <p className="text-sm font-semibold text-red-600">
            Quiz yüklenemedi (servis anahtarı eksik olabilir).
          </p>
        </Card>
      ) : !quiz ? (
        <Card className="mt-5 p-6">
          <p className="mb-4 text-sm text-muted">Bu modülün quizi yok.</p>
          <ActionButton variant="gold" onAction={createQuiz.bind(null, moduleId)}>
            Quiz oluştur
          </ActionButton>
        </Card>
      ) : (
        <>
          <Card className="mt-5 p-6">
            <QuizMetaForm quiz={{ id: quiz.id, baslik: quiz.baslik, gecme_esigi: quiz.gecme_esigi }} />
          </Card>

          <div className="mt-5 space-y-4">
            {quiz.questions.length === 0 ? (
              <p className="text-sm text-muted">Henüz soru yok.</p>
            ) : (
              quiz.questions.map((q, i) => <QuestionEditor key={q.id} question={q} index={i} />)
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <ActionButton onAction={createQuestion.bind(null, quiz.id)}>+ Soru ekle</ActionButton>
            <DeleteButton
              onDelete={deleteQuiz.bind(null, quiz.id)}
              uyari="Quizi, tüm sorularını ve şıklarını silmek istediğine emin misin?"
            />
          </div>
        </>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Modül sayfasına quiz linki**

`web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx` dosyasında, `<h1 ...>{modul.ad} · Dersler</h1>` satırından HEMEN SONRA (dersler `Card`'ından önce) ekle:
```tsx
      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy dark:text-white">Modül Quizi</span>
          <a
            href={`/admin/mufredat/${trackId}/${moduleId}/quiz`}
            className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]"
          >
            Quiz'i düzenle →
          </a>
        </div>
      </Card>
```
(Not: modül sayfasında değişken adı `modul` ise onu kullan; `trackId`/`moduleId` zaten mevcut.)

- [ ] **Step 3: Build + test**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`  → tsc temiz, 69 test PASS
Run: `cd /home/weslax83/stratos-akademi/web && npm run build`  → başarılı (yeni `.../quiz` rotası derlenir)

- [ ] **Step 4: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add "web/src/app/admin/mufredat/[trackId]/[moduleId]/quiz/page.tsx" "web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx" && git commit -m "feat(admin): quiz editör sayfası + modül sayfasına quiz linki"
```

---

## Task 7: Tam doğrulama + main'e merge + hafıza

- [ ] **Step 1: Tüm test + build**

Run: `cd /home/weslax83/stratos-akademi/web && npm run test && npm run build`  → testler PASS, build başarılı.

- [ ] **Step 2: Migration uygulama hatırlat**

Kullanıcıya hatırlat: `0011_admin_quiz_rls.sql` SQL editöründe çalıştırılmalı (yapılmadıysa).

- [ ] **Step 3: Uçtan uca elle kontrol (dev sunucu, admin & üye)**

- Admin: modül sayfasında "Quiz'i düzenle" linki → quiz yoksa oluştur; başlık/eşik kaydet; soru ekle/metin/sil; şık ekle/metin/doğru işaretle/sil; quizi sil.
- Üye: quiz tablolarına yazamaz (RLS); `/mufredat/quiz/[id]`'de `dogru`'yu hâlâ göremez; admin editörde görür.
- Eklenen quiz `/mufredat/[lessonId]` modül kartında çıkar ve çözülür; puanlama doğru.

- [ ] **Step 4: main'e merge**
```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/admin-quiz -m "Merge feat/admin-quiz: admin quiz CRUD (iç içe editör + service_role dogru + admin RLS)" && git push origin main
```

- [ ] **Step 5: Hafıza güncelle**

`stratos-akademi-platform.md` memory: "Admin: Quiz CRUD TAMAM" ekle (0011 RLS, service_role dogru okuma, iç içe editör, granular actions). "Sıradaki plan"ı üye/izin listesi yönetimine güncelle.

---

## Spec Kapsam Kontrolü (öz-değerlendirme)

- Quiz tabloları admin yazma RLS (0011) → Task 1 ✓
- `getQuizForAdmin` service_role, dogru dahil → Task 2 ✓
- 10 granular server action ({ok,error}) → Task 3 ✓
- Tek sayfa iç içe editör (quiz meta + soru + şık + doğru, granular + router.refresh) → Task 4, 5, 6 ✓
- Quiz yoksa oluştur; quiz sil cascade uyarı → Task 6 ✓
- Çok-doğru (checkbox), doğru-şık zorunlu değil (uyarı) → Task 5 ✓
- Modül sayfasına quiz linki → Task 6 ✓
- service_role anahtarı yoksa dostça hata → Task 2, 6 ✓
- Yeni saf fonksiyon yok → birim testi yok; tsc/build/manual → Task 6, 7 ✓
```
