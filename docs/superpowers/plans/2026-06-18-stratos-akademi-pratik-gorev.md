# Pratik Görev v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Üyelerin modül pratik görevlerine link/metin göndermesi ve kaptanın onaylayıp/reddedip geri bildirim vermesi.

**Architecture:** practical_tasks + task_submissions tabloları, RLS ile self-approval engeli (üye durum'u yalnız 'beklemede'); saf status yardımcıları (TDD); server action'lar + client `router.refresh()`; 3 yüzey (üye görev sayfası, admin görev CRUD, onay kuyruğu).

**Tech Stack:** Next.js 16 (App Router, RSC + Server Actions), TypeScript, Tailwind v3, Supabase (RLS), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-18-stratos-akademi-pratik-gorev-design.md`

---

## Çalışma kuralları (executor için)

- Komutlar `web/` içinde. `@/` → `web/src/`. Migration'ı **kullanıcı** SQL editörde uygular.
- Mevcut: `Card`/`Button`(type HTML attr geçer)/`Eyebrow`, `AppShell`(isAdmin), `AdminBreadcrumb`, `DeleteButton`(onDelete+uyari), `createClient` (`@/lib/supabase/server`). `is_admin()` SQL fonksiyonu mevcut. Admin sayfaları `/admin/layout.tsx` guard'ı altında.
- Tailwind: `navy`, `gold`, `gold-soft`, `gold-dark`, `muted`, `rounded-core`, `var(--line)`. `any` KULLANMA (build eslint).

## Dosya Yapısı

**Yeni:**
- `web/src/lib/tasks/status.ts` — SubmissionStatus + canEditSubmission + submissionStatusLabel (saf)
- `web/src/lib/tasks/queries.ts` — getModuleTasks, getPendingSubmissions
- `supabase/migrations/0013_practical_tasks.sql`
- `web/src/app/actions/tasks.ts` — submitTask, createTask, updateTask, deleteTask, reviewSubmission
- `web/src/components/tasks/SubmissionForm.tsx` (client)
- `web/src/components/tasks/ReviewControls.tsx` (client)
- `web/src/components/admin/TaskForm.tsx` (client)
- `web/src/app/mufredat/gorevler/[moduleId]/page.tsx` (üye)
- `web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx` (admin CRUD)
- `web/src/app/admin/onaylar/page.tsx` (onay kuyruğu)

**Değişen:**
- `web/src/app/mufredat/[lessonId]/page.tsx` — "Pratik Görevler (N)" kartı
- `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx` — "Pratik Görevler" linki
- `web/src/components/shell/Nav.tsx` — admin "Onaylar" linki

---

## Task 0: Dal aç

- [ ] **Step 1**
```bash
cd /home/weslax83/stratos-akademi && git checkout -b feat/pratik-gorev && git branch --show-current
```
Expected: `feat/pratik-gorev`

---

## Task 1: status.ts saf yardımcılar

**Files:** Create `web/src/lib/tasks/status.ts` · Test `web/src/test/tasks/status.test.ts`

- [ ] **Step 1: Başarısız test**

`web/src/test/tasks/status.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { canEditSubmission, submissionStatusLabel } from "@/lib/tasks/status";

describe("canEditSubmission", () => {
  it("gönderim yok / beklemede / red → düzenlenebilir", () => {
    expect(canEditSubmission(null)).toBe(true);
    expect(canEditSubmission("beklemede")).toBe(true);
    expect(canEditSubmission("red")).toBe(true);
  });
  it("onay → kilitli", () => {
    expect(canEditSubmission("onay")).toBe(false);
  });
});

describe("submissionStatusLabel", () => {
  it("durum etiketleri", () => {
    expect(submissionStatusLabel(null)).toBe("Gönderilmedi");
    expect(submissionStatusLabel("beklemede")).toBe("Beklemede");
    expect(submissionStatusLabel("onay")).toBe("Onaylandı");
    expect(submissionStatusLabel("red")).toBe("Reddedildi");
  });
});
```

- [ ] **Step 2: Başarısız doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/tasks/status.test.ts`  → FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

`web/src/lib/tasks/status.ts`:
```ts
export type SubmissionStatus = "beklemede" | "onay" | "red";

// Gönderim yok (null), beklemede veya red ise üye düzenleyebilir; onay ise kilitli.
export function canEditSubmission(durum: SubmissionStatus | null): boolean {
  return durum !== "onay";
}

export function submissionStatusLabel(durum: SubmissionStatus | null): string {
  switch (durum) {
    case "beklemede":
      return "Beklemede";
    case "onay":
      return "Onaylandı";
    case "red":
      return "Reddedildi";
    default:
      return "Gönderilmedi";
  }
}
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/tasks/status.test.ts`  → PASS (2 test)

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/tasks/status.ts web/src/test/tasks/status.test.ts && git commit -m "feat(gorev): submission status yardımcıları (canEdit/label)"
```

---

## Task 2: Şema + RLS migration (0013)

**Files:** Create `supabase/migrations/0013_practical_tasks.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0013_practical_tasks.sql`:
```sql
create table if not exists public.practical_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  baslik text not null,
  aciklama text,
  sira int not null default 0
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.practical_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  icerik text not null,
  durum text not null default 'beklemede' check (durum in ('beklemede','onay','red')),
  geri_bildirim text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists idx_tasks_module on public.practical_tasks(module_id, sira);
create index if not exists idx_subs_task on public.task_submissions(task_id);
create index if not exists idx_subs_durum on public.task_submissions(durum);

alter table public.practical_tasks enable row level security;
alter table public.task_submissions enable row level security;

-- practical_tasks: herkes okur; admin yazar.
create policy "tasks okunur" on public.practical_tasks
  for select to authenticated using (true);
create policy "tasks admin yazar" on public.practical_tasks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- task_submissions
create policy "sub okunur (kendi veya admin)" on public.task_submissions
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "sub üye ekler" on public.task_submissions
  for insert to authenticated with check (auth.uid() = user_id and durum = 'beklemede');
create policy "sub üye günceller" on public.task_submissions
  for update to authenticated
  using (auth.uid() = user_id and durum <> 'onay')
  with check (auth.uid() = user_id and durum = 'beklemede');
create policy "sub admin günceller" on public.task_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.practical_tasks to authenticated;
grant select, insert, update on public.task_submissions to authenticated;
```

- [ ] **Step 2: Kullanıcı uygular**

Kullanıcıdan iste: bu dosyayı Supabase SQL editöründe çalıştırsın ("Success. No rows returned" beklenir).

- [ ] **Step 3: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0013_practical_tasks.sql && git commit -m "feat(gorev): practical_tasks + task_submissions şema + RLS (0013)"
```

---

## Task 3: Veri okuma (queries.ts)

**Files:** Create `web/src/lib/tasks/queries.ts`

- [ ] **Step 1: Implementasyon**

`web/src/lib/tasks/queries.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus } from "./status";

export type PracticalTask = { id: string; baslik: string; aciklama: string | null; sira: number };
export type Submission = {
  id: string;
  icerik: string;
  durum: SubmissionStatus;
  geri_bildirim: string | null;
};
export type ModuleTask = { task: PracticalTask; submission: Submission | null };

export async function getModuleTasks(
  supabase: SupabaseClient,
  moduleId: string,
  userId: string | null,
): Promise<ModuleTask[]> {
  const { data: tasks } = await supabase
    .from("practical_tasks")
    .select("id, baslik, aciklama, sira")
    .eq("module_id", moduleId)
    .order("sira");
  const list = (tasks ?? []) as PracticalTask[];
  if (list.length === 0 || !userId) return list.map((t) => ({ task: t, submission: null }));

  const ids = list.map((t) => t.id);
  const { data: subs } = await supabase
    .from("task_submissions")
    .select("id, task_id, icerik, durum, geri_bildirim")
    .eq("user_id", userId)
    .in("task_id", ids);

  const byTask = new Map<string, Submission>();
  for (const s of (subs ?? []) as (Submission & { task_id: string })[]) {
    const { task_id, ...rest } = s;
    byTask.set(task_id, rest);
  }
  return list.map((t) => ({ task: t, submission: byTask.get(t.id) ?? null }));
}

export type PendingSubmission = {
  id: string;
  icerik: string;
  created_at: string;
  taskBaslik: string;
  modulAd: string;
  trackAd: string;
  uyeEmail: string;
};

type PendingRow = {
  id: string;
  icerik: string;
  created_at: string;
  user_id: string;
  practical_tasks: {
    baslik: string;
    modules: { ad: string; tracks: { ad: string } | null } | null;
  } | null;
};

export async function getPendingSubmissions(supabase: SupabaseClient): Promise<PendingSubmission[]> {
  const { data } = await supabase
    .from("task_submissions")
    .select("id, icerik, created_at, user_id, practical_tasks ( baslik, modules ( ad, tracks ( ad ) ) )")
    .eq("durum", "beklemede")
    .order("created_at");
  const rows = (data ?? []) as PendingRow[];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", userIds);
    for (const p of (profs ?? []) as { id: string; email: string }[]) emailById.set(p.id, p.email);
  }

  return rows.map((r) => ({
    id: r.id,
    icerik: r.icerik,
    created_at: r.created_at,
    taskBaslik: r.practical_tasks?.baslik ?? "(görev)",
    modulAd: r.practical_tasks?.modules?.ad ?? "",
    trackAd: r.practical_tasks?.modules?.tracks?.ad ?? "",
    uyeEmail: emailById.get(r.user_id) ?? "(üye)",
  }));
}
```

- [ ] **Step 2: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/tasks/queries.ts && git commit -m "feat(gorev): getModuleTasks + getPendingSubmissions"
```

---

## Task 4: Server actions (tasks.ts)

**Files:** Create `web/src/app/actions/tasks.ts`

- [ ] **Step 1: Implementasyon**

`web/src/app/actions/tasks.ts`:
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
    return "Bu işlem için yetkin yok.";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- ÜYE GÖNDERİMİ ----
export async function submitTask(
  taskId: string,
  icerik: string,
  userId: string,
): Promise<ActionResult> {
  try {
    const metin = (icerik ?? "").trim();
    if (!metin) return { ok: false, error: "İçerik boş olamaz." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("task_submissions")
      .upsert(
        {
          user_id: userId,
          task_id: taskId,
          icerik: metin,
          durum: "beklemede",
          geri_bildirim: null,
          reviewed_by: null,
          reviewed_at: null,
        },
        { onConflict: "user_id,task_id" },
      );
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("submitTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN GÖREV TANIMI CRUD ----
export async function createTask(fd: FormData): Promise<ActionResult> {
  try {
    const moduleId = str(fd, "module_id");
    const baslik = str(fd, "baslik");
    if (!moduleId) return { ok: false, error: "module_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").insert({
      module_id: moduleId,
      baslik,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateTask(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("practical_tasks")
      .update({ baslik, aciklama: str(fd, "aciklama") || null, sira: intOr(fd, "sira", 0) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN İNCELEME ----
export async function reviewSubmission(
  id: string,
  durum: "onay" | "red",
  geriBildirim: string,
  adminId: string,
): Promise<ActionResult> {
  try {
    const fb = (geriBildirim ?? "").trim();
    if (durum === "red" && !fb) return { ok: false, error: "Reddederken bir not gir." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("task_submissions")
      .update({
        durum,
        geri_bildirim: fb || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("reviewSubmission:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
```

- [ ] **Step 2: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/actions/tasks.ts && git commit -m "feat(gorev): server action'lar (submit/CRUD/review)"
```

---

## Task 5: Üye — SubmissionForm + görev sayfası + ders kartı

**Files:** Create `web/src/components/tasks/SubmissionForm.tsx`, `web/src/app/mufredat/gorevler/[moduleId]/page.tsx` · Modify `web/src/app/mufredat/[lessonId]/page.tsx`

- [ ] **Step 1: SubmissionForm (client)**

`web/src/components/tasks/SubmissionForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { submitTask } from "@/app/actions/tasks";
import { canEditSubmission, submissionStatusLabel, type SubmissionStatus } from "@/lib/tasks/status";

export function SubmissionForm({
  taskId,
  userId,
  submission,
}: {
  taskId: string;
  userId: string;
  submission: { icerik: string; durum: SubmissionStatus; geri_bildirim: string | null } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const durum = submission?.durum ?? null;
  const editable = canEditSubmission(durum);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const icerik = (fd.get("icerik") as string | null) ?? "";
    setError(null);
    start(async () => {
      const r = await submitTask(taskId, icerik, userId);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
        <span className="text-muted">Durum:</span>
        <span
          className={
            durum === "onay"
              ? "text-green-700 dark:text-green-400"
              : durum === "red"
                ? "text-red-600"
                : "text-muted"
          }
        >
          {submissionStatusLabel(durum)}
        </span>
      </div>

      {submission?.geri_bildirim && (
        <p className="mb-2 rounded-core bg-black/[0.04] p-3 text-sm text-navy dark:bg-white/[0.04] dark:text-white">
          <span className="font-semibold">Geri bildirim:</span> {submission.geri_bildirim}
        </p>
      )}

      {editable ? (
        <form onSubmit={onSubmit} className="space-y-2">
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <textarea
            name="icerik"
            defaultValue={submission?.icerik ?? ""}
            required
            rows={3}
            placeholder="Link (Drive/video) veya açıklama yaz…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
          />
          <Button variant="gold" disabled={pending}>{pending ? "…" : "Gönder"}</Button>
        </form>
      ) : (
        <p className="rounded-core border border-[var(--line)] p-3 text-sm text-muted">
          {submission?.icerik}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Üye görev sayfası**

`web/src/app/mufredat/gorevler/[moduleId]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SubmissionForm } from "@/components/tasks/SubmissionForm";
import { getModuleTasks } from "@/lib/tasks/queries";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function UyeGorevlerPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: modul } = await supabase
    .from("modules")
    .select("id, ad, track_id, tracks(ad)")
    .eq("id", moduleId)
    .single();
  if (!modul) notFound();

  const tasks = await getModuleTasks(supabase, moduleId, user?.id ?? null);
  const isAdmin = await isAdminUser(supabase, user?.id);
  const trackAd = (modul as { tracks: { ad: string } | null }).tracks?.ad ?? "";

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()} isAdmin={isAdmin}>
      <div className="mb-4">
        <Eyebrow>{trackAd} · {modul.ad}</Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          Pratik Görevler
        </h1>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted">Bu modülde pratik görev yok.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(({ task, submission }) => (
            <Card key={task.id} className="p-5">
              <h3 className="font-display text-lg font-bold text-navy dark:text-white">{task.baslik}</h3>
              {task.aciklama && (
                <p className="mt-1 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">
                  {task.aciklama}
                </p>
              )}
              {user && <SubmissionForm taskId={task.id} userId={user.id} submission={submission} />}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 3: Ders sayfasına "Pratik Görevler" kartı**

`web/src/app/mufredat/[lessonId]/page.tsx` dosyasında:

`import` bloğuna ekle:
```tsx
import Link from "next/link";
```
(Eğer zaten varsa tekrar ekleme.)

`const quizBest = ...` satırından SONRA ekle (görev sayısını oku):
```tsx
  const { count: gorevSayisi } = await supabase
    .from("practical_tasks")
    .select("id", { count: "exact", head: true })
    .eq("module_id", found.module.id);
```

`{quiz && <ModuleQuizCard ... />}` satırından SONRA ekle:
```tsx
      {gorevSayisi != null && gorevSayisi > 0 && (
        <Link
          href={`/mufredat/gorevler/${found.module.id}`}
          className="mt-4 flex items-center justify-between rounded-core border border-[var(--line)] bg-[var(--panel)] p-5"
        >
          <span className="font-display font-bold text-navy dark:text-white">
            Pratik Görevler ({gorevSayisi})
          </span>
          <span className="text-sm font-semibold text-gold">Görevlere git →</span>
        </Link>
      )}
```

- [ ] **Step 4: Build + test**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`  → tsc temiz, tüm testler PASS

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/tasks/SubmissionForm.tsx web/src/app/mufredat/gorevler "web/src/app/mufredat/[lessonId]/page.tsx" && git commit -m "feat(gorev): üye görev sayfası + gönderim formu + ders kartı"
```

---

## Task 6: Admin — TaskForm + görev CRUD sayfası + modül linki

**Files:** Create `web/src/components/admin/TaskForm.tsx`, `web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx` · Modify `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`

- [ ] **Step 1: TaskForm (client)**

`web/src/components/admin/TaskForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createTask, updateTask } from "@/app/actions/tasks";

type Task = { id: string; baslik: string; aciklama: string | null; sira: number };

export function TaskForm({ moduleId, editing }: { moduleId: string; editing: Task | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateTask(fd) : await createTask(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${form.dataset.track}/${moduleId}/gorevler`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="module_id" value={moduleId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Başlık *</span>
        <input
          name="baslik"
          defaultValue={editing?.baslik}
          required
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Açıklama</span>
        <textarea
          name="aciklama"
          defaultValue={editing?.aciklama ?? ""}
          rows={3}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Sıra</span>
        <input
          name="sira"
          type="number"
          defaultValue={String(editing?.sira ?? 0)}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <Button variant="gold" disabled={pending}>{pending ? "…" : editing ? "Güncelle" : "Ekle"}</Button>
    </form>
  );
}
```
Not: düzenleme iptali için sayfada "İptal" linki olacak; bu form sade tutuldu (editing'de güncelleyince listeye döner; `form.dataset.track` kullanımı yerine basitçe `router.refresh()` de yeterli — aşağıdaki sayfa `?edit` query'siyle çalışır). **Basitleştir:** `onSubmit` başarı dalında editing için de `router.push` yerine sadece sayfanın `?edit`'siz haline götür. Bunu yapmak için forma `trackId` prop'u ekle:

Formun imzasını ve push'unu şu hale getir (yukarıdakini bununla DEĞİŞTİR — `trackId` prop eklenir):
```tsx
export function TaskForm({ trackId, moduleId, editing }: { trackId: string; moduleId: string; editing: Task | null }) {
```
ve onSubmit başarı dalı:
```tsx
      if (editing) router.push(`/admin/mufredat/${trackId}/${moduleId}/gorevler`);
      else { form.reset(); router.refresh(); }
```
(`form.dataset.track` kullanma.)

- [ ] **Step 2: Admin görev CRUD sayfası**

`web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { TaskForm } from "@/components/admin/TaskForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteTask } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";

type Task = { id: string; baslik: string; aciklama: string | null; sira: number };

export default async function AdminGorevlerPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string; moduleId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { trackId, moduleId } = await params;
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

  const { data: track } = await supabase.from("tracks").select("id, ad").eq("id", trackId).single();
  const { data: modul } = await supabase.from("modules").select("id, ad").eq("id", moduleId).single();
  if (!track || !modul) notFound();

  const { data: tasksData } = await supabase
    .from("practical_tasks")
    .select("id, baslik, aciklama, sira")
    .eq("module_id", moduleId)
    .order("sira");
  const list = (tasksData ?? []) as Task[];
  const editing = edit ? list.find((t) => t.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: modul.ad, href: `/admin/mufredat/${trackId}/${moduleId}` },
          { label: "Pratik Görevler" },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {modul.ad} · Pratik Görevler
      </h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz görev yok.</p>
        ) : (
          list.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="w-7 text-center text-xs font-bold text-muted">{t.sira}</span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">{t.baslik}</span>
              <a
                href={`/admin/mufredat/${trackId}/${moduleId}/gorevler?edit=${t.id}`}
                className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white"
              >
                Düzenle
              </a>
              <DeleteButton
                onDelete={deleteTask.bind(null, t.id)}
                uyari={`"${t.baslik}" görevini silmek istediğine emin misin? Gönderimler de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Görevi düzenle" : "Yeni görev"}
        </h2>
        <TaskForm key={editing?.id ?? "new"} trackId={trackId} moduleId={moduleId} editing={editing} />
        {editing && (
          <a href={`/admin/mufredat/${trackId}/${moduleId}/gorevler`} className="mt-3 inline-block text-xs font-semibold text-muted">
            İptal
          </a>
        )}
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 3: Modül sayfasına "Pratik Görevler" linki**

`web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx` içinde, mevcut "Modül Quizi" Card'ından SONRA ekle:
```tsx
      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy dark:text-white">Pratik Görevler</span>
          <a
            href={`/admin/mufredat/${trackId}/${moduleId}/gorevler`}
            className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]"
          >
            Görevleri düzenle →
          </a>
        </div>
      </Card>
```

- [ ] **Step 4: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/TaskForm.tsx "web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx" "web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx" && git commit -m "feat(gorev): admin görev CRUD sayfası + TaskForm + modül linki"
```

---

## Task 7: Admin — ReviewControls + onay kuyruğu + Nav linki

**Files:** Create `web/src/components/tasks/ReviewControls.tsx`, `web/src/app/admin/onaylar/page.tsx` · Modify `web/src/components/shell/Nav.tsx`

- [ ] **Step 1: ReviewControls (client)**

`web/src/components/tasks/ReviewControls.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission } from "@/app/actions/tasks";

export function ReviewControls({ submissionId, adminId }: { submissionId: string; adminId: string }) {
  const [pending, start] = useTransition();
  const [redMode, setRedMode] = useState(false);
  const [not, setNot] = useState("");
  const router = useRouter();

  function approve() {
    start(async () => {
      const r = await reviewSubmission(submissionId, "onay", "", adminId);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function reject() {
    start(async () => {
      const r = await reviewSubmission(submissionId, "red", not, adminId);
      if (!r.ok) { window.alert(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  if (redMode) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          value={not}
          onChange={(e) => setNot(e.target.value)}
          rows={2}
          placeholder="Reddetme nedeni…"
          className="min-w-[200px] flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
        <div className="flex gap-2">
          <button onClick={reject} disabled={pending} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Reddet
          </button>
          <button onClick={() => setRedMode(false)} disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={pending} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        Onayla
      </button>
      <button onClick={() => setRedMode(true)} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Reddet
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Onay kuyruğu sayfası**

`web/src/app/admin/onaylar/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ReviewControls } from "@/components/tasks/ReviewControls";
import { getPendingSubmissions } from "@/lib/tasks/queries";

export const dynamic = "force-dynamic";

export default async function OnaylarPage() {
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

  const pending = await getPendingSubmissions(supabase);

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Onaylar</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
        Onay Kuyruğu ({pending.length})
      </h1>

      {pending.length === 0 ? (
        <Card className="mt-5 p-6">
          <p className="text-sm text-muted">Bekleyen gönderim yok.</p>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {pending.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="mb-1 text-xs font-semibold text-gold">
                {s.trackAd} · {s.modulAd}
              </div>
              <div className="font-display font-bold text-navy dark:text-white">{s.taskBaslik}</div>
              <div className="mb-2 text-xs text-muted">{s.uyeEmail}</div>
              <div className="mb-3 rounded-core border border-[var(--line)] p-3 text-sm text-navy dark:text-white">
                {/^https?:\/\//.test(s.icerik) ? (
                  <a href={s.icerik} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-gold underline">
                    {s.icerik}
                  </a>
                ) : (
                  <span className="whitespace-pre-line">{s.icerik}</span>
                )}
              </div>
              <ReviewControls submissionId={s.id} adminId={user!.id} />
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 3: Nav'a "Onaylar" linki**

`web/src/components/shell/Nav.tsx` içindeki admin link bloğu şu an "Yönetim" + "Üyeler" içeriyor. "Üyeler" Link'inden SONRA (kapanış `</>` ve `)`'den önce) ekle:
```tsx
            <Link href="/admin/onaylar" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Onaylar
            </Link>
```

- [ ] **Step 4: Build + test**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`  → tsc temiz, tüm testler PASS
Run: `cd /home/weslax83/stratos-akademi/web && npm run build`  → başarılı (yeni rotalar: `/mufredat/gorevler/[moduleId]`, `/admin/.../gorevler`, `/admin/onaylar`)

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/tasks/ReviewControls.tsx web/src/app/admin/onaylar/page.tsx web/src/components/shell/Nav.tsx && git commit -m "feat(gorev): onay kuyruğu + ReviewControls + Nav Onaylar linki"
```

---

## Task 8: Tam doğrulama + main'e merge + hafıza

- [ ] **Step 1: Tüm test + build**

Run: `cd /home/weslax83/stratos-akademi/web && npm run test && npm run build`  → testler PASS, build başarılı.

- [ ] **Step 2: Migration uygulama hatırlat**

Kullanıcıya hatırlat: `0013_practical_tasks.sql` SQL editöründe çalıştırılmalı (yapılmadıysa).

- [ ] **Step 3: Uçtan uca elle kontrol (dev sunucu, admin & üye)**

- Admin: modül → "Pratik Görevler" → görev ekle/düzenle/sil.
- Üye: ders sayfasında "Pratik Görevler (N)" kartı → görev sayfası → link/metin gönder → "Beklemede"; düzenle.
- Admin: Nav "Onaylar" → kuyrukta gönderimi onayla / reddet+not → üye durumu/geri bildirimi görür; onaylanınca üye formu kilitli.
- Self-approval: üye doğrudan durum='onay' yapamaz (RLS). Üye `/admin/onaylar` → `/panom`.

- [ ] **Step 4: main'e merge**
```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/pratik-gorev -m "Merge feat/pratik-gorev: pratik görev v1 (tanım + gönderim + onay kuyruğu)" && git push origin main
```

- [ ] **Step 5: Hafıza güncelle**

`stratos-akademi-platform.md` memory: "Pratik Görev v1 TAMAM" ekle (0013 şema/RLS self-approval engeli, üye gönderim + onay kuyruğu, link/metin). "Sıradaki plan"ı dosya yükleme (Storage) + puan entegrasyonuna güncelle.

---

## Spec Kapsam Kontrolü (öz-değerlendirme)

- practical_tasks + task_submissions şema + RLS (self-approval engeli) → Task 2 ✓
- Saf yardımcılar (canEditSubmission/submissionStatusLabel) TDD → Task 1 ✓
- getModuleTasks + getPendingSubmissions → Task 3 ✓
- submitTask/createTask/updateTask/deleteTask/reviewSubmission ({ok,error}) → Task 4 ✓
- Üye görev sayfası + gönderim formu + ders kartı → Task 5 ✓
- Admin görev CRUD + modül linki → Task 6 ✓
- Onay kuyruğu + ReviewControls + Nav "Onaylar" → Task 7 ✓
- red'de geri bildirim zorunlu; içerik link ise tıklanır → Task 4, 7 ✓
- Testler (status helpers) → Task 1 ✓
```
