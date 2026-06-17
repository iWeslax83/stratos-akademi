# Admin Müfredat CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adminlerin müfredatı (dal/modül/ders) web arayüzünden ekleyip düzenleyip silmesi.

**Architecture:** `is_admin()` SECURITY DEFINER + admin yazma RLS politikaları; `/admin` guard'lı layout; seviye-seviye sayfalar (dal → modül → ders), her biri server component + FormData server action'ları; saf yardımcılar (parseYouTubeId, slugify) TDD ile.

**Tech Stack:** Next.js 16 (App Router, RSC + Server Actions, revalidatePath), TypeScript, Tailwind v3, Supabase (RLS), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-17-stratos-akademi-admin-mufredat-design.md`

---

## Çalışma kuralları (executor için)

- Komutlar `web/` içinde (örn. `cd /home/weslax83/stratos-akademi/web && npx vitest run ...`).
- Testler `src/test/**`, `import { describe, it, expect } from "vitest"`.
- `@/` → `web/src/`. Migration dosyaları yazılır, **uygulamayı kullanıcı yapar** (SQL editör).
- Tailwind tokenları: `navy`, `gold`, `gold-soft`, `gold-dark`, `muted`, `rounded-core`, `var(--line)`, `var(--panel)`.
- Mevcut: `Card` (`@/components/ui/Card`, `className`+`outerClassName`), `Button` (variant primary|ghost|gold, `type` HTML attr geçer), `Eyebrow`, `AppShell` (`initial`/`streak`/`points`), `createClient` (`@/lib/supabase/server`).

## Dosya Yapısı

**Yeni — saf (TDD):**
- `web/src/lib/admin/youtube.ts` — `parseYouTubeId`
- `web/src/lib/admin/slug.ts` — `slugify`

**Yeni — server actions:**
- `web/src/app/actions/admin-curriculum.ts` — CRUD × {track, module, lesson}

**Yeni — guard + sayfalar:**
- `web/src/app/admin/layout.tsx`
- `web/src/app/admin/mufredat/page.tsx`
- `web/src/app/admin/mufredat/[trackId]/page.tsx`
- `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`

**Yeni — bileşenler:**
- `web/src/components/admin/DeleteButton.tsx` (client)
- `web/src/components/admin/AdminBreadcrumb.tsx`
- `web/src/components/admin/TrackForm.tsx`, `ModuleForm.tsx`, `LessonForm.tsx` (client)

**Değişen:**
- `web/src/components/shell/Nav.tsx` — `isAdmin` prop + "Yönetim" linki
- `web/src/components/shell/AppShell.tsx` — `isAdmin` geçişi

**Yeni — migration:**
- `supabase/migrations/0010_admin_curriculum_rls.sql`

---

## Task 0: Dal aç

- [ ] **Step 1**

```bash
cd /home/weslax83/stratos-akademi && git checkout -b feat/admin-mufredat && git branch --show-current
```
Expected: `feat/admin-mufredat`

---

## Task 1: parseYouTubeId

**Files:** Create `web/src/lib/admin/youtube.ts` · Test `web/src/test/admin/youtube.test.ts`

- [ ] **Step 1: Başarısız test**

`web/src/test/admin/youtube.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseYouTubeId } from "@/lib/admin/youtube";

describe("parseYouTubeId", () => {
  it("watch?v= URL'sinden id çıkarır", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("youtu.be kısa linkinden", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("embed ve shorts'tan", () => {
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("ekstra parametrelerle", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
  });
  it("çıplak 11-hane id olduğu gibi döner", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("geçersiz girdi null", () => {
    expect(parseYouTubeId("merhaba dünya")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});
```

- [ ] **Step 2: Başarısız doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/youtube.test.ts`
Expected: FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

`web/src/lib/admin/youtube.ts`:
```ts
// Tam YouTube URL'lerinden 11-hane video id çıkarır; zaten geçerli 11-hane id ise
// olduğu gibi döner; aksi halde null.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (ID_RE.test(s)) return s;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/, // watch?v=
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // kısa link
    /\/embed\/([A-Za-z0-9_-]{11})/, // embed
    /\/shorts\/([A-Za-z0-9_-]{11})/, // shorts
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/youtube.test.ts`
Expected: PASS (6 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/admin/youtube.ts web/src/test/admin/youtube.test.ts && git commit -m "feat(admin): parseYouTubeId yardımcısı"
```

---

## Task 2: slugify

**Files:** Create `web/src/lib/admin/slug.ts` · Test `web/src/test/admin/slug.test.ts`

- [ ] **Step 1: Başarısız test**

`web/src/test/admin/slug.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/admin/slug";

describe("slugify", () => {
  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugify("Çağdaş Yazılım")).toBe("cagdas-yazilim");
    expect(slugify("İHA Pilotluğu")).toBe("iha-pilotlugu");
    expect(slugify("Öğrenci Görüşü")).toBe("ogrenci-gorusu");
  });
  it("boşluk ve özel karakter → tek tire", () => {
    expect(slugify("Ortak   Temel!!!")).toBe("ortak-temel");
    expect(slugify("a / b & c")).toBe("a-b-c");
  });
  it("baş/son tireyi kırpar, küçük harfe çevirir", () => {
    expect(slugify("  Elektronik  ")).toBe("elektronik");
  });
  it("boş girdi boş döner", () => {
    expect(slugify("")).toBe("");
  });
});
```

- [ ] **Step 2: Başarısız doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/slug.test.ts`
Expected: FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

`web/src/lib/admin/slug.ts`:
```ts
const TR: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

export function slugify(s: string): string {
  return (s ?? "")
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => TR[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/slug.test.ts`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/admin/slug.ts web/src/test/admin/slug.test.ts && git commit -m "feat(admin): slugify yardımcısı (Türkçe)"
```

---

## Task 3: RLS migration (0010)

**Files:** Create `supabase/migrations/0010_admin_curriculum_rls.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0010_admin_curriculum_rls.sql`:
```sql
-- auth.uid() admin mi? SECURITY DEFINER → profiles'a RLS özyinelemesine girmeden okur.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$func$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin yazma politikaları (mevcut SELECT "okunur" politikaları durur; OR'lanır,
-- üye okuması bozulmaz). Yazma yalnız is_admin() true ise.
create policy "tracks admin yazar" on public.tracks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "modules admin yazar" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lessons admin yazar" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.tracks to authenticated;
grant insert, update, delete on public.modules to authenticated;
grant insert, update, delete on public.lessons to authenticated;
```

- [ ] **Step 2: Kullanıcı uygular**

Kullanıcıdan iste: bu dosyayı Supabase SQL editöründe çalıştırsın ("Success. No rows returned" beklenir). `$func$` sınırlayıcısı kullanıldığından "no language specified" hatası gelmemeli.

- [ ] **Step 3: Doğrula (kullanıcı SQL editör)**

```sql
select public.is_admin();
```
Beklenen: SQL editörde (postgres rolü) hata olmadan döner. Asıl admin/üye ayrımı uygulamada elle test edilecek.

- [ ] **Step 4: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0010_admin_curriculum_rls.sql && git commit -m "feat(admin): is_admin() + müfredat admin yazma RLS (0010)"
```

---

## Task 4: Server actions (admin-curriculum.ts)

**Files:** Create `web/src/app/actions/admin-curriculum.ts`

- [ ] **Step 1: Implementasyon**

`web/src/app/actions/admin-curriculum.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/admin/youtube";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function intOrNull(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (!s) return null;
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : null;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- TRACK ----
export async function createTrack(fd: FormData): Promise<ActionResult> {
  try {
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").insert({
      ad, slug,
      aciklama: str(fd, "aciklama") || null,
      ikon: str(fd, "ikon") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("createTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateTrack(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!id) return { ok: false, error: "id eksik." };
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").update({
      ad, slug,
      aciklama: str(fd, "aciklama") || null,
      ikon: str(fd, "ikon") || null,
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("updateTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteTrack(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("deleteTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- MODULE ----
export async function createModule(fd: FormData): Promise<ActionResult> {
  try {
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!trackId) return { ok: false, error: "track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("modules").insert({
      track_id: trackId, ad,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("createModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateModule(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!id || !trackId) return { ok: false, error: "id/track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("modules").update({
      ad,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("updateModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteModule(id: string, trackId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("deleteModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- LESSON ----
export async function createLesson(fd: FormData): Promise<ActionResult> {
  try {
    const moduleId = str(fd, "module_id");
    const trackId = str(fd, "track_id");
    const baslik = str(fd, "baslik");
    if (!moduleId || !trackId) return { ok: false, error: "module_id/track_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const vid = parseYouTubeId(str(fd, "youtube"));
    if (!vid) return { ok: false, error: "Geçersiz YouTube bağlantısı veya id." };
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").insert({
      module_id: moduleId, baslik, youtube_video_id: vid,
      aciklama: str(fd, "aciklama") || null,
      sure_sn: intOrNull(fd, "sure_sn"),
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("createLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateLesson(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const moduleId = str(fd, "module_id");
    const trackId = str(fd, "track_id");
    const baslik = str(fd, "baslik");
    if (!id || !moduleId || !trackId) return { ok: false, error: "id/module_id/track_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const vid = parseYouTubeId(str(fd, "youtube"));
    if (!vid) return { ok: false, error: "Geçersiz YouTube bağlantısı veya id." };
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").update({
      baslik, youtube_video_id: vid,
      aciklama: str(fd, "aciklama") || null,
      sure_sn: intOrNull(fd, "sure_sn"),
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("updateLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteLesson(id: string, trackId: string, moduleId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("deleteLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
```

- [ ] **Step 2: Tip kontrolü**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`
Expected: hata yok

- [ ] **Step 3: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/actions/admin-curriculum.ts && git commit -m "feat(admin): müfredat CRUD server action'ları"
```

---

## Task 5: Admin guard layout + Nav/AppShell isAdmin

**Files:** Create `web/src/app/admin/layout.tsx` · Modify `web/src/components/shell/Nav.tsx`, `web/src/components/shell/AppShell.tsx`

- [ ] **Step 1: Admin layout (guard)**

`web/src/app/admin/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/panom");
  return <>{children}</>;
}
```

- [ ] **Step 2: Nav — isAdmin + Yönetim linki**

`web/src/components/shell/Nav.tsx` içinde imza ve linkleri güncelle. Yeni imza:
```tsx
export function Nav({
  initial = "E",
  streak,
  points,
  isAdmin = false,
}: {
  initial?: string;
  streak?: number;
  points?: number;
  isAdmin?: boolean;
}) {
```
Ve link bloğunun (Müfredat/Panom/Liderlik linkleri olan `<div className="ml-2 hidden ... sm:flex">`) içine, Liderlik linkinden SONRA ekle:
```tsx
        {isAdmin && (
          <Link href="/admin/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
            Yönetim
          </Link>
        )}
```

- [ ] **Step 3: AppShell — isAdmin geçişi**

`web/src/components/shell/AppShell.tsx` (tamamını değiştir):
```tsx
import { Nav } from "./Nav";

export function AppShell({
  children,
  initial,
  streak,
  points,
  isAdmin,
}: {
  children: React.ReactNode;
  initial?: string;
  streak?: number;
  points?: number;
  isAdmin?: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-6">
      <Nav initial={initial} streak={streak} points={points} isAdmin={isAdmin} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Tip + test + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`
Expected: tsc temiz, tüm testler PASS.

```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/admin/layout.tsx web/src/components/shell/Nav.tsx web/src/components/shell/AppShell.tsx && git commit -m "feat(admin): /admin guard layout + Nav Yönetim linki"
```

---

## Task 6: Ortak bileşenler (DeleteButton, AdminBreadcrumb)

**Files:** Create `web/src/components/admin/DeleteButton.tsx`, `web/src/components/admin/AdminBreadcrumb.tsx`

- [ ] **Step 1: DeleteButton (client)**

`web/src/components/admin/DeleteButton.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  onDelete,
  uyari,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  uyari: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function click() {
    if (!window.confirm(uyari)) return;
    start(async () => {
      const r = await onDelete();
      if (!r.ok) window.alert(r.error ?? "Silinemedi");
      else router.refresh();
    });
  }

  return (
    <button
      onClick={click}
      disabled={pending}
      className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300"
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}
```

- [ ] **Step 2: AdminBreadcrumb**

`web/src/components/admin/AdminBreadcrumb.tsx`:
```tsx
import Link from "next/link";

export function AdminBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-navy dark:hover:text-white">
              {it.label}
            </Link>
          ) : (
            <span className="text-navy dark:text-white">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`
Expected: hata yok

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/DeleteButton.tsx web/src/components/admin/AdminBreadcrumb.tsx && git commit -m "feat(admin): DeleteButton + AdminBreadcrumb bileşenleri"
```

---

## Task 7: TrackForm + dallar sayfası

**Files:** Create `web/src/components/admin/TrackForm.tsx`, `web/src/app/admin/mufredat/page.tsx`

- [ ] **Step 1: TrackForm (client)**

`web/src/components/admin/TrackForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createTrack, updateTrack } from "@/app/actions/admin-curriculum";

type Track = {
  id: string;
  slug: string;
  ad: string;
  aciklama: string | null;
  ikon: string | null;
  sira: number;
};

function Field({
  name, label, defaultValue, type = "text", required = false,
}: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">
        {label}{required && " *"}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
      />
    </label>
  );
}

export function TrackForm({ editing }: { editing: Track | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateTrack(fd) : await createTrack(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push("/admin/mufredat");
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <Field name="ad" label="Ad" defaultValue={editing?.ad} required />
      <Field name="slug" label="Slug" defaultValue={editing?.slug} required />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="ikon" label="İkon (emoji)" defaultValue={editing?.ikon ?? ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button variant="gold" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <a href="/admin/mufredat">
            <Button variant="ghost" type="button">İptal</Button>
          </a>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Dallar sayfası**

`web/src/app/admin/mufredat/page.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TrackForm } from "@/components/admin/TrackForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteTrack } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
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

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, slug, ad, aciklama, ikon, sira")
    .order("sira");
  const list = tracks ?? [];
  const editing = edit ? list.find((t) => t.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Müfredat</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">Dallar</h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz dal yok.</p>
        ) : (
          list.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <span className="w-7 text-center text-xs font-bold text-muted">{t.sira}</span>
              <span className="text-lg">{t.ikon ?? "•"}</span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">
                {t.ad} <span className="text-xs font-normal text-muted">/{t.slug}</span>
              </span>
              <Link href={`/admin/mufredat/${t.id}`} className="text-xs font-semibold text-muted hover:text-navy dark:hover:text-white">
                Modüller →
              </Link>
              <Link href={`/admin/mufredat?edit=${t.id}`} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
                Düzenle
              </Link>
              <DeleteButton
                onDelete={deleteTrack.bind(null, t.id)}
                uyari={`"${t.ad}" dalını silmek istediğine emin misin? Tüm modülleri, dersleri ve quizleri de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Dalı düzenle" : "Yeni dal"}
        </h2>
        <TrackForm key={editing?.id ?? "new"} editing={editing} />
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 3: Tip + test**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`
Expected: tsc temiz, testler PASS.

- [ ] **Step 4: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/TrackForm.tsx web/src/app/admin/mufredat/page.tsx && git commit -m "feat(admin): dallar CRUD sayfası + TrackForm"
```

---

## Task 8: ModuleForm + modüller sayfası

**Files:** Create `web/src/components/admin/ModuleForm.tsx`, `web/src/app/admin/mufredat/[trackId]/page.tsx`

- [ ] **Step 1: ModuleForm (client)**

`web/src/components/admin/ModuleForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createModule, updateModule } from "@/app/actions/admin-curriculum";

type Module = { id: string; ad: string; aciklama: string | null; sira: number };

function Field({
  name, label, defaultValue, type = "text", required = false,
}: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">
        {label}{required && " *"}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
      />
    </label>
  );
}

export function ModuleForm({ trackId, editing }: { trackId: string; editing: Module | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateModule(fd) : await createModule(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${trackId}`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="track_id" value={trackId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <Field name="ad" label="Ad" defaultValue={editing?.ad} required />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button variant="gold" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <a href={`/admin/mufredat/${trackId}`}>
            <Button variant="ghost" type="button">İptal</Button>
          </a>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Modüller sayfası**

`web/src/app/admin/mufredat/[trackId]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteModule } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { trackId } = await params;
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
  if (!track) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, ad, aciklama, sira")
    .eq("track_id", trackId)
    .order("sira");
  const list = modules ?? [];
  const editing = edit ? list.find((m) => m.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[{ label: "Müfredat", href: "/admin/mufredat" }, { label: track.ad }]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {track.ad} · Modüller
      </h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz modül yok.</p>
        ) : (
          list.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <span className="w-7 text-center text-xs font-bold text-muted">{m.sira}</span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">{m.ad}</span>
              <Link href={`/admin/mufredat/${trackId}/${m.id}`} className="text-xs font-semibold text-muted hover:text-navy dark:hover:text-white">
                Dersler →
              </Link>
              <Link href={`/admin/mufredat/${trackId}?edit=${m.id}`} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
                Düzenle
              </Link>
              <DeleteButton
                onDelete={deleteModule.bind(null, m.id, trackId)}
                uyari={`"${m.ad}" modülünü silmek istediğine emin misin? Dersleri ve quizi de silinecek.`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Modülü düzenle" : "Yeni modül"}
        </h2>
        <ModuleForm key={editing?.id ?? "new"} trackId={trackId} editing={editing} />
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 3: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`
Expected: hata yok

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/ModuleForm.tsx "web/src/app/admin/mufredat/[trackId]/page.tsx" && git commit -m "feat(admin): modüller CRUD sayfası + ModuleForm"
```

---

## Task 9: LessonForm + dersler sayfası

**Files:** Create `web/src/components/admin/LessonForm.tsx`, `web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`

- [ ] **Step 1: LessonForm (client)**

`web/src/components/admin/LessonForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createLesson, updateLesson } from "@/app/actions/admin-curriculum";

type Lesson = {
  id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: string | null;
  sure_sn: number | null;
  sira: number;
};

function Field({
  name, label, defaultValue, type = "text", required = false, placeholder,
}: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">
        {label}{required && " *"}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
      />
    </label>
  );
}

export function LessonForm({
  trackId, moduleId, editing,
}: {
  trackId: string; moduleId: string; editing: Lesson | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateLesson(fd) : await createLesson(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${trackId}/${moduleId}`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="track_id" value={trackId} />
      <input type="hidden" name="module_id" value={moduleId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <Field name="baslik" label="Başlık" defaultValue={editing?.baslik} required />
      <Field
        name="youtube"
        label="YouTube (URL veya id)"
        defaultValue={editing?.youtube_video_id ?? ""}
        required
        placeholder="https://youtu.be/... veya dQw4w9WgXcQ"
      />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="sure_sn" label="Süre (saniye)" type="number" defaultValue={editing?.sure_sn != null ? String(editing.sure_sn) : ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button variant="gold" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <a href={`/admin/mufredat/${trackId}/${moduleId}`}>
            <Button variant="ghost" type="button">İptal</Button>
          </a>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Dersler sayfası**

`web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LessonForm } from "@/components/admin/LessonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteLesson } from "@/app/actions/admin-curriculum";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage({
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
  const { data: module } = await supabase.from("modules").select("id, ad").eq("id", moduleId).single();
  if (!track || !module) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, baslik, youtube_video_id, aciklama, sure_sn, sira")
    .eq("module_id", moduleId)
    .order("sira");
  const list = lessons ?? [];
  const editing = edit ? list.find((l) => l.id === edit) ?? null : null;

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: module.ad },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {module.ad} · Dersler
      </h1>

      <Card className="mt-5 p-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted">Henüz ders yok.</p>
        ) : (
          list.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <span className="w-7 text-center text-xs font-bold text-muted">{l.sira}</span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">
                {l.baslik}{" "}
                <span className="text-xs font-normal text-muted">({l.youtube_video_id})</span>
              </span>
              <a
                href={`/admin/mufredat/${trackId}/${moduleId}?edit=${l.id}`}
                className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white"
              >
                Düzenle
              </a>
              <DeleteButton
                onDelete={deleteLesson.bind(null, l.id, trackId, moduleId)}
                uyari={`"${l.baslik}" dersini silmek istediğine emin misin?`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">
          {editing ? "Dersi düzenle" : "Yeni ders"}
        </h2>
        <LessonForm key={editing?.id ?? "new"} trackId={trackId} moduleId={moduleId} editing={editing} />
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 3: Tip + test + build**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`
Expected: tsc temiz, tüm testler PASS.

- [ ] **Step 4: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/LessonForm.tsx "web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx" && git commit -m "feat(admin): dersler CRUD sayfası + LessonForm (YouTube URL→id)"
```

---

## Task 10: Tam doğrulama + main'e merge + hafıza

- [ ] **Step 1: Tüm test + build**

Run: `cd /home/weslax83/stratos-akademi/web && npm run test && npm run build`
Expected: tüm testler PASS; production build başarılı (yeni `/admin/*` rotaları derlenir).

- [ ] **Step 2: Migration uygulama hatırlat**

Kullanıcıya hatırlat: `0010_admin_curriculum_rls.sql` SQL editöründe çalıştırılmalı (yapılmadıysa). Ayrıca kullanıcının kendi hesabını admin yapması gerekebilir:
```sql
update public.profiles set role = 'admin' where email = '<senin-emailin>';
update public.allowlist set role = 'admin' where email = '<senin-emailin>';
```

- [ ] **Step 3: Uçtan uca elle kontrol (dev sunucu, admin hesapla)**

- Admin: Nav'da "Yönetim" görünür; `/admin/mufredat` açılır.
- Üye (admin değil): `/admin/mufredat` → `/panom`'a yönlenir; Nav'da "Yönetim" yok.
- Dal ekle/düzenle/sil; YouTube URL yapıştırınca ders id'ye dönüşür; cascade silme uyarısı çıkar.
- Eklenen içerik `/mufredat` (üye görünümü) ve `/panom`'da görünür.

- [ ] **Step 4: main'e merge**

```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/admin-mufredat -m "Merge feat/admin-mufredat: admin müfredat CRUD paneli (is_admin RLS + dal/modül/ders yönetimi)" && git push origin main
```

- [ ] **Step 5: Hafıza güncelle**

`stratos-akademi-platform.md` memory: "Admin: Müfredat CRUD TAMAM" ekle (is_admin() RLS, /admin guard, seviye-seviye CRUD, parseYouTubeId/slugify). "Sıradaki plan"ı **Quiz CRUD admin** + üye yönetimine güncelle.

---

## Spec Kapsam Kontrolü (öz-değerlendirme)

- `is_admin()` + admin yazma RLS → Task 3 ✓
- `/admin` guard + Nav "Yönetim" (yalnız admin) → Task 5 ✓
- Seviye-seviye sayfalar (dal/modül/ders) → Task 7, 8, 9 ✓
- Server actions CRUD × 3 entity, `{ok,error}` + revalidatePath → Task 4 ✓
- `parseYouTubeId`, `slugify` (TDD) → Task 1, 2 ✓
- Silme cascade uyarılı onay (DeleteButton) → Task 6, 7, 8, 9 ✓
- Manuel `sira` alanı → formlarda ✓
- Slug oluşturmada belirlenir (düzenlenebilir; uyarı spec'te; alan formda) → Task 7 ✓
- Hata yönetimi (errMsg RLS→dostça, try/catch) → Task 4 ✓
- Testler (youtube, slug) → Task 1, 2 ✓
```
