# Pratik Görev Dosya Yükleme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Üyelerin pratik göreve foto/PDF yükleyebilmesi; kaptanın imzalı URL ile görmesi.

**Architecture:** Storage bucket `gorev-dosyalari` (private) + `task_submissions.dosya_yolu`; tarayıcıdan yükleme (browser supabase client), görüntüleme service_role imzalı URL; saf validateFile/uploadPath (TDD).

**Tech Stack:** Next.js 16, TS, Supabase Storage + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-18-stratos-akademi-gorev-dosya-design.md`

---

## Çalışma kuralları
`web/` içinde. `@/`→`web/src/`. Migration'ı kullanıcı SQL editörde uygular. `any` kullanma.

## Task 0: Dal
- [ ] `cd /home/weslax83/stratos-akademi && git checkout -b feat/gorev-dosya && git branch --show-current` → `feat/gorev-dosya`

---

## Task 1: upload.ts saf yardımcılar (TDD)

**Files:** Create `web/src/lib/tasks/upload.ts`, `web/src/test/tasks/upload.test.ts`

- [ ] **Step 1: Test** — `web/src/test/tasks/upload.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateFile, uploadPath, MAX_FILE_BYTES } from "@/lib/tasks/upload";

describe("validateFile", () => {
  it("izinli tipler null döner", () => {
    expect(validateFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateFile({ type: "application/pdf", size: 1000 })).toBeNull();
  });
  it("yanlış tip hata", () => {
    expect(validateFile({ type: "text/plain", size: 10 })).toMatch(/JPG|PNG|WEBP|PDF/);
  });
  it("büyük boyut hata", () => {
    expect(validateFile({ type: "image/png", size: MAX_FILE_BYTES + 1 })).toMatch(/5MB/);
  });
});

describe("uploadPath", () => {
  it("yapı: userId/taskId/stamp-ad", () => {
    expect(uploadPath("u1", "t1", "foto.png", 123)).toBe("u1/t1/123-foto.png");
  });
  it("güvensiz karakterleri sadeleştirir", () => {
    expect(uploadPath("u1", "t1", "a b/c?.png", 9)).toBe("u1/t1/9-a_b_c_.png");
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/tasks/upload.test.ts` → FAIL

- [ ] **Step 3: Implementasyon** — `web/src/lib/tasks/upload.ts`:
```ts
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validateFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Yalnız JPG, PNG, WEBP veya PDF yükleyebilirsin.";
  if (file.size > MAX_FILE_BYTES) return "Dosya 5MB'tan büyük olamaz.";
  return null;
}

export function uploadPath(userId: string, taskId: string, fileName: string, stamp: number): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${taskId}/${stamp}-${safe}`;
}
```

- [ ] **Step 4: Geçtiğini doğrula** — aynı komut → PASS (5 test)

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/tasks/upload.ts web/src/test/tasks/upload.test.ts && git commit -m "feat(dosya): validateFile + uploadPath yardımcıları"
```

---

## Task 2: Migration 0015 (bucket + kolon + storage RLS)

**Files:** Create `supabase/migrations/0015_gorev_dosya.sql` (spec'teki SQL birebir).

- [ ] **Step 1:** Dosyayı spec'teki içerikle oluştur.
- [ ] **Step 2:** Kullanıcı SQL editörde çalıştırır (sonda).
- [ ] **Step 3: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0015_gorev_dosya.sql && git commit -m "feat(dosya): gorev-dosyalari bucket + dosya_yolu + storage RLS (0015)"
```

---

## Task 3: signed.ts + queries dosya_yolu + submitTask dosyaYolu

**Files:** Create `web/src/lib/tasks/signed.ts` · Modify `web/src/lib/tasks/queries.ts`, `web/src/app/actions/tasks.ts`

- [ ] **Step 1: signed.ts**
```ts
import { createServiceClient } from "@/lib/supabase/service";

export async function signedUrlMap(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = [...new Set(paths.filter((p): p is string => !!p))];
  if (clean.length === 0) return map;
  const svc = createServiceClient();
  const { data } = await svc.storage.from("gorev-dosyalari").createSignedUrls(clean, 3600);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
```

- [ ] **Step 2: queries.ts**
  - `Submission` tipine `dosya_yolu: string | null;` ekle; `getModuleTasks` select `"id, task_id, icerik, durum, geri_bildirim"` → `"id, task_id, icerik, durum, geri_bildirim, dosya_yolu"`.
  - `PendingSubmission` tipine `dosya_yolu: string | null;` ekle; `PendingRow` tipine `dosya_yolu: string | null;` ekle; `getPendingSubmissions` select başına `id, icerik, created_at, user_id, dosya_yolu, practical_tasks ( ... )`; map'e `dosya_yolu: r.dosya_yolu` ekle.

- [ ] **Step 3: actions/tasks.ts** — `submitTask` imzasını `(taskId, icerik, userId, dosyaYolu: string | null)` yap. Doğrulamayı değiştir: `if (!metin && !dosyaYolu) return { ok:false, error:"Link/metin veya dosya gerekli." };` (mevcut "İçerik boş olamaz." kontrolünü bununla değiştir, `metin` hesabı kalır). upsert nesnesine `dosya_yolu: dosyaYolu` ekle.

- [ ] **Step 4: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit
```
sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/tasks/signed.ts web/src/lib/tasks/queries.ts web/src/app/actions/tasks.ts && git commit -m "feat(dosya): signedUrlMap + dosya_yolu (queries + submitTask)"
```

---

## Task 4: SubmissionForm dosya yükleme + üye sayfası imzalı URL

**Files:** Modify `web/src/components/tasks/SubmissionForm.tsx`, `web/src/app/mufredat/gorevler/[moduleId]/page.tsx`

- [ ] **Step 1: SubmissionForm** (tamamını değiştir):
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { submitTask } from "@/app/actions/tasks";
import { canEditSubmission, submissionStatusLabel, type SubmissionStatus } from "@/lib/tasks/status";
import { validateFile, uploadPath } from "@/lib/tasks/upload";

export function SubmissionForm({
  taskId,
  userId,
  submission,
  dosyaUrl,
}: {
  taskId: string;
  userId: string;
  submission: {
    icerik: string;
    durum: SubmissionStatus;
    geri_bildirim: string | null;
    dosya_yolu: string | null;
  } | null;
  dosyaUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const durum = submission?.durum ?? null;
  const editable = canEditSubmission(durum);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const icerik = ((fd.get("icerik") as string | null) ?? "").trim();
    setError(null);
    start(async () => {
      let dosyaYolu = submission?.dosya_yolu ?? null;
      if (file) {
        const v = validateFile({ type: file.type, size: file.size });
        if (v) { setError(v); return; }
        const path = uploadPath(userId, taskId, file.name, Date.now());
        const sb = createClient();
        const { error: upErr } = await sb.storage.from("gorev-dosyalari").upload(path, file, { upsert: false });
        if (upErr) { setError("Dosya yüklenemedi: " + upErr.message); return; }
        dosyaYolu = path;
      }
      if (!icerik && !dosyaYolu) { setError("Link/metin veya dosya gerekli."); return; }
      const r = await submitTask(taskId, icerik, userId, dosyaYolu);
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

      {submission?.dosya_yolu && dosyaUrl && (
        <a
          href={dosyaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 inline-block text-sm font-semibold text-gold underline"
        >
          Yüklenen dosya →
        </a>
      )}

      {editable ? (
        <form onSubmit={onSubmit} className="space-y-2">
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <textarea
            name="icerik"
            defaultValue={submission?.icerik ?? ""}
            rows={3}
            placeholder="Link (Drive/video) veya açıklama yaz…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy dark:file:bg-white/10 dark:file:text-white"
          />
          <Button variant="gold" disabled={pending}>{pending ? "Gönderiliyor…" : "Gönder"}</Button>
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

- [ ] **Step 2: Üye sayfası** — `web/src/app/mufredat/gorevler/[moduleId]/page.tsx`:
  - import ekle: `import { signedUrlMap } from "@/lib/tasks/signed";`
  - `const tasks = await getModuleTasks(...)` satırından SONRA:
```tsx
  const dosyaYollari = tasks
    .map((t) => t.submission?.dosya_yolu)
    .filter((p): p is string => !!p);
  const urlMap = await signedUrlMap(dosyaYollari);
```
  - `<SubmissionForm ... />` çağrısına `dosyaUrl` prop ekle:
```tsx
              {user && (
                <SubmissionForm
                  taskId={task.id}
                  userId={user.id}
                  submission={submission}
                  dosyaUrl={submission?.dosya_yolu ? (urlMap.get(submission.dosya_yolu) ?? null) : null}
                />
              )}
```

- [ ] **Step 3: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test
```
sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/tasks/SubmissionForm.tsx "web/src/app/mufredat/gorevler/[moduleId]/page.tsx" && git commit -m "feat(dosya): SubmissionForm dosya yükleme + üye imzalı URL"
```

---

## Task 5: Onay kuyruğunda dosya linki

**Files:** Modify `web/src/app/admin/onaylar/page.tsx`

- [ ] **Step 1:** import ekle: `import { signedUrlMap } from "@/lib/tasks/signed";`
- [ ] **Step 2:** `const pending = await getPendingSubmissions(supabase);` satırından SONRA:
```tsx
  const urlMap = await signedUrlMap(
    pending.map((s) => s.dosya_yolu).filter((p): p is string => !!p),
  );
```
- [ ] **Step 3:** İçerik kutusundan (`<div className="mb-3 rounded-core border ...">...</div>`) SONRA, `<ReviewControls .../>`'dan ÖNCE ekle:
```tsx
              {s.dosya_yolu && urlMap.get(s.dosya_yolu) && (
                <a
                  href={urlMap.get(s.dosya_yolu)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 inline-block text-sm font-semibold text-gold underline"
                >
                  Yüklenen dosya →
                </a>
              )}
```

- [ ] **Step 4: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test && npm run build
```
sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/admin/onaylar/page.tsx && git commit -m "feat(dosya): onay kuyruğunda yüklenen dosya linki"
```

---

## Task 6: Doğrulama + merge + hafıza
- [ ] `cd web && npm run test && npm run build` → PASS/başarılı.
- [ ] Kullanıcıya `0015_gorev_dosya.sql` hatırlat (bucket + storage RLS).
- [ ] Elle: üye foto/PDF yükler → onay kuyruğunda "Yüklenen dosya" açılır; yanlış tip/boyut reddedilir.
- [ ] main merge:
```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/gorev-dosya -m "Merge feat/gorev-dosya: pratik görev dosya yükleme (Storage)" && git push origin main
```
- [ ] Hafıza: "Görev dosya yükleme TAMAM (0015)" ekle; bekleyen migration listesine 0015 ekle.

## Spec Kapsam Kontrolü
- bucket + dosya_yolu + storage RLS (0015) → Task 2 ✓
- validateFile/uploadPath (TDD) → Task 1 ✓
- signedUrlMap → Task 3 ✓
- queries dosya_yolu + submitTask dosyaYolu → Task 3 ✓
- SubmissionForm yükleme + üye URL → Task 4 ✓
- onay kuyruğu dosya linki → Task 5 ✓
