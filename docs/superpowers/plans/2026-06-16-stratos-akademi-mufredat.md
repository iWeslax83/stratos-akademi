# Stratos Akademi — Müfredat + Ders + İlerleme Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Üyelerin dal→modül→ders hiyerarşisinde gezinip videoları izlediği, ilerlemenin video ~%90'da otomatik kaydedildiği müfredat deneyimini kurmak.

**Architecture:** Supabase'de `tracks/modules/lessons/lesson_progress` tabloları (RLS+GRANT). Sunucu bileşenleri müfredatı ve kullanıcının ilerlemesini çeker; istemci `LessonPlayer` (YouTube IFrame Player API) videoyu izler ve %90'da bir Next server action ile `lesson_progress`'i upsert eder. İlerleme/durum hesapları saf fonksiyonlarda (TDD).

**Tech Stack:** Next.js 16 (App Router, TS), Supabase (@supabase/ssr), YouTube IFrame Player API, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-stratos-akademi-mufredat-design.md`

---

## Dosya Yapısı

```
supabase/migrations/0002_curriculum.sql          # tablolar + RLS + GRANT
supabase/migrations/0003_seed_curriculum.sql     # curated başlangıç tohumu (gerçek YouTube ID'leri)
web/src/lib/curriculum/types.ts                  # Track/Module/Lesson/Curriculum tipleri
web/src/lib/curriculum/progress.ts               # isComplete, flatten, statüler, resume, genel ilerleme (saf)
web/src/lib/curriculum/queries.ts                # getCurriculum, getCompletedLessonIds
web/src/app/actions/lessons.ts                   # markLessonComplete server action
web/src/components/curriculum/CurriculumTree.tsx # sol müfredat ağacı (✓/●/○)
web/src/components/curriculum/LessonPlayer.tsx   # YouTube IFrame API + ilerleme tespiti
web/src/components/curriculum/LessonSection.tsx  # istemci sarmalayıcı (player + manuel buton + sonraki)
web/src/app/mufredat/page.tsx                    # müfredat ağacı sayfası
web/src/app/mufredat/[lessonId]/page.tsx         # ders sayfası
web/src/app/panom/page.tsx                       # "kaldığın yerden devam et" güncellemesi
web/src/test/curriculum/progress.test.ts         # saf fonksiyon testleri
web/src/test/curriculum/CurriculumTree.test.tsx  # ağaç durum render testi
```

**Kural:** Komutlar `web/` içinden (aksi belirtilmedikçe). Branch: yeni `feat/mufredat`. Migration'lar Supabase SQL Editor'de **insan** tarafından uygulanır (subagent uygulayamaz; DB şifresi yok) — ilgili adımlar **[İNSAN]** ile işaretli.

---

### Task 1: Veritabanı şeması (migration 0002)

**Files:** Create: `supabase/migrations/0002_curriculum.sql`

- [ ] **Step 1: Migration dosyasını yaz**

Create `supabase/migrations/0002_curriculum.sql`:

```sql
-- Dallar (track), Modüller, Dersler, ve kullanıcı ilerlemesi

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  ad text not null,
  aciklama text,
  ikon text,
  sira int not null default 0
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  ad text not null,
  aciklama text,
  sira int not null default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  baslik text not null,
  youtube_video_id text not null,
  aciklama text,
  sure_sn int,
  sira int not null default 0
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists idx_modules_track on public.modules(track_id, sira);
create index if not exists idx_lessons_module on public.lessons(module_id, sira);
create index if not exists idx_progress_user on public.lesson_progress(user_id);

alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

-- İçerik: giriş yapan herkes okur.
create policy "tracks okunur" on public.tracks for select using (auth.role() = 'authenticated');
create policy "modules okunur" on public.modules for select using (auth.role() = 'authenticated');
create policy "lessons okunur" on public.lessons for select using (auth.role() = 'authenticated');

-- İlerleme: kullanıcı yalnız kendi satırını okur/yazar.
create policy "ilerleme kendi okunur" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "ilerleme kendi eklenir" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "ilerleme kendi güncellenir" on public.lesson_progress for update using (auth.uid() = user_id);

-- Tablo-düzeyi yetkiler (RLS satırları kısıtlar; PostgREST için GRANT şart).
grant select on public.tracks to authenticated;
grant select on public.modules to authenticated;
grant select on public.lessons to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
```

- [ ] **Step 2: [İNSAN] Supabase'de uygula**

Supabase → SQL Editor → New query → yukarıdaki dosyanın içeriğini yapıştır → Run.
Expected: "Success. No rows returned".

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add supabase/migrations/0002_curriculum.sql && git commit -m "feat(db): curriculum schema (tracks/modules/lessons/lesson_progress) + RLS + GRANT"
```

---

### Task 2: Tipler ve ilerleme saf fonksiyonları (TDD)

**Files:**
- Create: `web/src/lib/curriculum/types.ts`, `web/src/lib/curriculum/progress.ts`
- Test: `web/src/test/curriculum/progress.test.ts`

- [ ] **Step 1: Tipleri yaz**

Create `web/src/lib/curriculum/types.ts`:

```ts
export type Lesson = {
  id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: string | null;
  sure_sn: number | null;
  sira: number;
};

export type Module = {
  id: string;
  ad: string;
  aciklama: string | null;
  sira: number;
  lessons: Lesson[];
};

export type Track = {
  id: string;
  slug: string;
  ad: string;
  aciklama: string | null;
  ikon: string | null;
  sira: number;
  modules: Module[];
};

export type Curriculum = Track[];

export type LessonStatus = "done" | "current" | "todo";

export type FlatLesson = { lesson: Lesson; module: Module; track: Track };
```

- [ ] **Step 2: Başarısız testi yaz**

Create `web/src/test/curriculum/progress.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  isComplete,
  flatten,
  computeStatuses,
  resumeLessonId,
  overallProgress,
  findNext,
} from "@/lib/curriculum/progress";
import type { Curriculum } from "@/lib/curriculum/types";

const L = (id: string, sira: number) => ({
  id,
  baslik: id,
  youtube_video_id: "vid" + id,
  aciklama: null,
  sure_sn: null,
  sira,
});

const curriculum: Curriculum = [
  {
    id: "t1",
    slug: "t1",
    ad: "Track 1",
    aciklama: null,
    ikon: null,
    sira: 1,
    modules: [
      { id: "m1", ad: "M1", aciklama: null, sira: 1, lessons: [L("a", 1), L("b", 2)] },
      { id: "m2", ad: "M2", aciklama: null, sira: 2, lessons: [L("c", 1)] },
    ],
  },
];

describe("isComplete", () => {
  it("%90 ve üzeri için true", () => {
    expect(isComplete(90, 100)).toBe(true);
    expect(isComplete(95, 100)).toBe(true);
  });
  it("%90 altı için false", () => {
    expect(isComplete(89, 100)).toBe(false);
  });
  it("süre 0/negatifse false (sıfıra bölme koruması)", () => {
    expect(isComplete(10, 0)).toBe(false);
    expect(isComplete(10, -5)).toBe(false);
  });
});

describe("flatten", () => {
  it("dersleri dal>modül>ders sırasına göre düzleştirir", () => {
    expect(flatten(curriculum).map((f) => f.lesson.id)).toEqual(["a", "b", "c"]);
  });
});

describe("computeStatuses", () => {
  it("tamamlananlar done, ilk tamamlanmamış current, gerisi todo", () => {
    const s = computeStatuses(curriculum, new Set(["a"]));
    expect(s.get("a")).toBe("done");
    expect(s.get("b")).toBe("current");
    expect(s.get("c")).toBe("todo");
  });
});

describe("resumeLessonId", () => {
  it("ilk tamamlanmamış dersi verir", () => {
    expect(resumeLessonId(curriculum, new Set(["a"]))).toBe("b");
  });
  it("hepsi tamamsa null", () => {
    expect(resumeLessonId(curriculum, new Set(["a", "b", "c"]))).toBeNull();
  });
});

describe("overallProgress", () => {
  it("tamamlanan/toplam ve yüzde", () => {
    expect(overallProgress(curriculum, new Set(["a", "b"]))).toEqual({ done: 2, total: 3, pct: 67 });
  });
});

describe("findNext", () => {
  it("verilen dersten sonraki düz sıradaki dersi verir", () => {
    expect(findNext(curriculum, "a")?.lesson.id).toBe("b");
    expect(findNext(curriculum, "c")).toBeNull();
  });
});
```

- [ ] **Step 3: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/curriculum/progress.test.ts`
Expected: FAIL — `@/lib/curriculum/progress` yok.

- [ ] **Step 4: progress.ts'i uygula**

Create `web/src/lib/curriculum/progress.ts`:

```ts
import type { Curriculum, FlatLesson, LessonStatus } from "./types";

export function isComplete(currentSeconds: number, durationSeconds: number): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return currentSeconds / durationSeconds >= 0.9;
}

export function flatten(curriculum: Curriculum): FlatLesson[] {
  const out: FlatLesson[] = [];
  for (const track of [...curriculum].sort((a, b) => a.sira - b.sira)) {
    for (const module of [...track.modules].sort((a, b) => a.sira - b.sira)) {
      for (const lesson of [...module.lessons].sort((a, b) => a.sira - b.sira)) {
        out.push({ lesson, module, track });
      }
    }
  }
  return out;
}

export function computeStatuses(
  curriculum: Curriculum,
  completedIds: Set<string>,
): Map<string, LessonStatus> {
  const map = new Map<string, LessonStatus>();
  let currentAssigned = false;
  for (const { lesson } of flatten(curriculum)) {
    if (completedIds.has(lesson.id)) {
      map.set(lesson.id, "done");
    } else if (!currentAssigned) {
      map.set(lesson.id, "current");
      currentAssigned = true;
    } else {
      map.set(lesson.id, "todo");
    }
  }
  return map;
}

export function resumeLessonId(curriculum: Curriculum, completedIds: Set<string>): string | null {
  for (const { lesson } of flatten(curriculum)) {
    if (!completedIds.has(lesson.id)) return lesson.id;
  }
  return null;
}

export function overallProgress(
  curriculum: Curriculum,
  completedIds: Set<string>,
): { done: number; total: number; pct: number } {
  const all = flatten(curriculum);
  const total = all.length;
  const done = all.filter((f) => completedIds.has(f.lesson.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function findNext(curriculum: Curriculum, lessonId: string): FlatLesson | null {
  const all = flatten(curriculum);
  const idx = all.findIndex((f) => f.lesson.id === lessonId);
  if (idx === -1 || idx + 1 >= all.length) return null;
  return all[idx + 1];
}
```

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/curriculum/progress.test.ts`
Expected: PASS (tüm testler).

- [ ] **Step 6: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/lib/curriculum/types.ts web/src/lib/curriculum/progress.ts web/src/test/curriculum/progress.test.ts && git commit -m "feat(curriculum): types + progress pure functions (TDD)"
```

---

### Task 3: Müfredat veri sorguları

**Files:** Create: `web/src/lib/curriculum/queries.ts`

- [ ] **Step 1: queries.ts'i yaz**

Create `web/src/lib/curriculum/queries.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Curriculum, Lesson, Module, Track } from "./types";

type TrackRow = Omit<Track, "modules">;
type ModuleRow = Omit<Module, "lessons"> & { track_id: string };
type LessonRow = Lesson & { module_id: string };

export async function getCurriculum(supabase: SupabaseClient): Promise<Curriculum> {
  const [{ data: tracks }, { data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("tracks").select("id,slug,ad,aciklama,ikon,sira").order("sira"),
    supabase.from("modules").select("id,track_id,ad,aciklama,sira").order("sira"),
    supabase
      .from("lessons")
      .select("id,module_id,baslik,youtube_video_id,aciklama,sure_sn,sira")
      .order("sira"),
  ]);

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const row of (lessons ?? []) as LessonRow[]) {
    const { module_id, ...lesson } = row;
    const arr = lessonsByModule.get(module_id) ?? [];
    arr.push(lesson);
    lessonsByModule.set(module_id, arr);
  }

  const modulesByTrack = new Map<string, Module[]>();
  for (const row of (modules ?? []) as ModuleRow[]) {
    const { track_id, ...rest } = row;
    const module: Module = { ...rest, lessons: lessonsByModule.get(rest.id) ?? [] };
    const arr = modulesByTrack.get(track_id) ?? [];
    arr.push(module);
    modulesByTrack.set(track_id, arr);
  }

  return ((tracks ?? []) as TrackRow[]).map((t) => ({
    ...t,
    modules: modulesByTrack.get(t.id) ?? [],
  }));
}

export async function getCompletedLessonIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true);
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id));
}
```

- [ ] **Step 2: Tip kontrolü / derleme**

Run: `cd web && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/lib/curriculum/queries.ts && git commit -m "feat(curriculum): curriculum + completed-progress queries"
```

---

### Task 4: markLessonComplete server action

**Files:** Create: `web/src/app/actions/lessons.ts`

- [ ] **Step 1: Server action'ı yaz**

Create `web/src/app/actions/lessons.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function markLessonComplete(lessonId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  return { ok: !error };
}
```

- [ ] **Step 2: Derleme kontrolü**

Run: `cd web && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/app/actions/lessons.ts && git commit -m "feat(curriculum): markLessonComplete server action (idempotent upsert)"
```

---

### Task 5: Müfredat ağacı bileşeni + /mufredat sayfası

**Files:**
- Create: `web/src/components/curriculum/CurriculumTree.tsx`, `web/src/app/mufredat/page.tsx`
- Test: `web/src/test/curriculum/CurriculumTree.test.tsx`

- [ ] **Step 1: Ağaç bileşeni için başarısız test yaz**

Create `web/src/test/curriculum/CurriculumTree.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurriculumTree } from "@/components/curriculum/CurriculumTree";
import type { Curriculum } from "@/lib/curriculum/types";
import { computeStatuses } from "@/lib/curriculum/progress";

const curriculum: Curriculum = [
  {
    id: "t1", slug: "ortak", ad: "Ortak Temel", aciklama: null, ikon: "🚀", sira: 1,
    modules: [
      { id: "m1", ad: "Drone Temelleri", aciklama: null, sira: 1, lessons: [
        { id: "a", baslik: "Ders A", youtube_video_id: "x", aciklama: null, sure_sn: null, sira: 1 },
        { id: "b", baslik: "Ders B", youtube_video_id: "y", aciklama: null, sure_sn: null, sira: 2 },
      ] },
    ],
  },
];

describe("CurriculumTree", () => {
  it("dal, modül ve dersleri durum işaretiyle gösterir", () => {
    const statuses = computeStatuses(curriculum, new Set(["a"]));
    render(<CurriculumTree curriculum={curriculum} statuses={statuses} activeLessonId={null} />);
    expect(screen.getByText("Ortak Temel")).toBeInTheDocument();
    expect(screen.getByText("Drone Temelleri")).toBeInTheDocument();
    // tamamlanan ders 'done' işareti taşır
    expect(screen.getByTestId("status-a")).toHaveTextContent("✓");
    expect(screen.getByTestId("status-b")).toHaveTextContent("●");
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/curriculum/CurriculumTree.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: CurriculumTree'yi uygula**

Create `web/src/components/curriculum/CurriculumTree.tsx`:

```tsx
import Link from "next/link";
import { clsx } from "clsx";
import type { Curriculum, LessonStatus } from "@/lib/curriculum/types";

const ICON: Record<LessonStatus, string> = { done: "✓", current: "●", todo: "○" };

export function CurriculumTree({
  curriculum,
  statuses,
  activeLessonId,
}: {
  curriculum: Curriculum;
  statuses: Map<string, LessonStatus>;
  activeLessonId: string | null;
}) {
  return (
    <nav className="space-y-5">
      {curriculum.map((track) => (
        <div key={track.id}>
          <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
            <span>{track.ikon}</span>
            <span>{track.ad}</span>
          </div>
          {track.modules.map((module) => (
            <div key={module.id} className="mb-2">
              <div className="px-1 py-1 text-xs font-semibold text-muted">{module.ad}</div>
              <ul>
                {module.lessons.map((lesson) => {
                  const status = statuses.get(lesson.id) ?? "todo";
                  const active = lesson.id === activeLessonId;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/mufredat/${lesson.id}`}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold",
                          active
                            ? "bg-gold-soft text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]"
                            : status === "done"
                              ? "text-navy dark:text-white"
                              : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                        )}
                      >
                        <span
                          data-testid={`status-${lesson.id}`}
                          className={clsx(
                            "grid h-4 w-4 flex-none place-items-center text-[10px]",
                            status === "done" && "text-green-600",
                            status === "current" && "text-gold",
                          )}
                        >
                          {ICON[status]}
                        </span>
                        <span className="truncate">{lesson.baslik}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/curriculum/CurriculumTree.test.tsx`
Expected: PASS.

- [ ] **Step 5: /mufredat sayfasını yaz**

Create `web/src/app/mufredat/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CurriculumTree } from "@/components/curriculum/CurriculumTree";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { computeStatuses, overallProgress } from "@/lib/curriculum/progress";

export const dynamic = "force-dynamic";

export default async function MufredatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curriculum = await getCurriculum(supabase);
  const completed = user ? await getCompletedLessonIds(supabase, user.id) : new Set<string>();
  const statuses = computeStatuses(curriculum, completed);
  const progress = overallProgress(curriculum, completed);

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()}>
      <div className="mb-4">
        <Eyebrow>Müfredat</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Öğrenme yolun
        </h1>
        <p className="mt-1.5 text-muted">
          {progress.done}/{progress.total} ders tamamlandı · %{progress.pct}
        </p>
      </div>
      <Card className="p-5">
        {curriculum.length === 0 ? (
          <p className="text-sm text-muted">Henüz içerik eklenmedi.</p>
        ) : (
          <CurriculumTree curriculum={curriculum} statuses={statuses} activeLessonId={null} />
        )}
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 6: Derleme + tüm testler**

Run: `cd web && npm run build && npm test`
Expected: Build `Compiled successfully`; tüm testler PASS.

- [ ] **Step 7: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/components/curriculum/CurriculumTree.tsx web/src/app/mufredat/page.tsx web/src/test/curriculum/CurriculumTree.test.tsx && git commit -m "feat(curriculum): CurriculumTree component and /mufredat page (TDD)"
```

---

### Task 6: LessonPlayer (YouTube IFrame API)

**Files:** Create: `web/src/components/curriculum/LessonPlayer.tsx`

- [ ] **Step 1: LessonPlayer'ı yaz**

Create `web/src/components/curriculum/LessonPlayer.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { isComplete } from "@/lib/curriculum/progress";

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YtPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function LessonPlayer({
  videoId,
  onComplete,
}: {
  videoId: string;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const firedRef = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    firedRef.current = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            interval = setInterval(() => {
              const p = playerRef.current;
              if (!p || typeof p.getCurrentTime !== "function") return;
              if (!firedRef.current && isComplete(p.getCurrentTime(), p.getDuration())) {
                firedRef.current = true;
                setDone(true);
                onComplete();
                if (interval) clearInterval(interval);
              }
            }, 5000);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, onComplete]);

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-core bg-black">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {done && (
        <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-400">
          ✓ Bu ders tamamlandı olarak işaretlendi
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

Run: `cd web && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/components/curriculum/LessonPlayer.tsx && git commit -m "feat(curriculum): LessonPlayer with YouTube IFrame API + 90% completion detection"
```

---

### Task 7: Ders bölümü sarmalayıcı + ders sayfası

**Files:**
- Create: `web/src/components/curriculum/LessonSection.tsx`, `web/src/app/mufredat/[lessonId]/page.tsx`

- [ ] **Step 1: LessonSection (istemci) yaz**

Create `web/src/components/curriculum/LessonSection.tsx`:

```tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LessonPlayer } from "./LessonPlayer";
import { Button } from "@/components/ui/Button";
import { markLessonComplete } from "@/app/actions/lessons";

export function LessonSection({
  lessonId,
  videoId,
  initiallyCompleted,
  nextHref,
}: {
  lessonId: string;
  videoId: string;
  initiallyCompleted: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [isPending, startTransition] = useTransition();

  const complete = useCallback(() => {
    startTransition(async () => {
      const res = await markLessonComplete(lessonId);
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    });
  }, [lessonId, router]);

  return (
    <div>
      <LessonPlayer videoId={videoId} onComplete={complete} />
      <div className="mt-5 flex items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ✓ Tamamlandı
          </span>
        ) : (
          <Button variant="ghost" onClick={complete} disabled={isPending}>
            {isPending ? "Kaydediliyor…" : "İzledim"}
          </Button>
        )}
        {nextHref && (
          <Link href={nextHref}>
            <Button variant="primary" icon="→">
              Sonraki ders
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ders sayfasını yaz**

Create `web/src/app/mufredat/[lessonId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LessonSection } from "@/components/curriculum/LessonSection";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
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
    </AppShell>
  );
}
```

- [ ] **Step 3: Derleme + testler**

Run: `cd web && npm run build && npm test`
Expected: Build `Compiled successfully`; testler PASS.

- [ ] **Step 4: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/components/curriculum/LessonSection.tsx "web/src/app/mufredat/[lessonId]/page.tsx" && git commit -m "feat(curriculum): lesson page with player, completion and next-lesson"
```

---

### Task 8: /panom "kaldığın yerden devam et" güncellemesi

**Files:** Modify: `web/src/app/panom/page.tsx`

- [ ] **Step 1: /panom sayfasını güncelle**

`web/src/app/panom/page.tsx` dosyasının TAMAMINI şu içerikle değiştir:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { flatten, resumeLessonId, overallProgress } from "@/lib/curriculum/progress";

export const dynamic = "force-dynamic";

export default async function PanomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();

  const ad = profile?.ad ?? profile?.email ?? "üye";
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const curriculum = await getCurriculum(supabase);
  const completed = await getCompletedLessonIds(supabase, user!.id);
  const progress = overallProgress(curriculum, completed);
  const resumeId = resumeLessonId(curriculum, completed);
  const resume = resumeId ? flatten(curriculum).find((f) => f.lesson.id === resumeId) : null;

  return (
    <AppShell initial={initial}>
      <div className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad} 👋
        </h1>
        <p className="mt-1.5 text-muted">
          Toplam ilerleme: {progress.done}/{progress.total} ders · %{progress.pct}
        </p>
      </div>

      <Card className="p-6">
        {resume ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
                Kaldığın yerden · {resume.track.ad}
              </span>
              <h3 className="mt-1 font-display text-xl font-bold text-navy dark:text-white">
                {resume.lesson.baslik}
              </h3>
            </div>
            <Link href={`/mufredat/${resume.lesson.id}`}>
              <Button variant="primary" icon="→">
                Devam et
              </Button>
            </Link>
          </div>
        ) : curriculum.length === 0 ? (
          <p className="text-sm text-muted">Müfredat yakında eklenecek.</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              🎉 Tüm dersleri tamamladın!
            </p>
            <Link href="/mufredat">
              <Button variant="ghost">Müfredatı gör</Button>
            </Link>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 2: Derleme + testler**

Run: `cd web && npm run build && npm test`
Expected: Build `Compiled successfully`; testler PASS.

- [ ] **Step 3: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add web/src/app/panom/page.tsx && git commit -m "feat(curriculum): /panom resume-where-you-left-off and overall progress"
```

---

### Task 9: Başlangıç tohumu (seed migration 0003) + canlı doğrulama

**Files:** Create: `supabase/migrations/0003_seed_curriculum.sql`

- [ ] **Step 1: Seed migration'ı yaz (gerçek YouTube ID'leri)**

Create `supabase/migrations/0003_seed_curriculum.sql`:

```sql
-- Curated başlangıç müfredatı. Tekrar çalıştırmaya karşı güvenli (slug/ad ile idempotent değil;
-- yalnız boş veritabanında bir kez çalıştırın).

-- Dallar
insert into public.tracks (slug, ad, aciklama, ikon, sira) values
  ('ortak-temel', 'Ortak Temel', 'Herkesin başladığı drone temelleri', '🚀', 1),
  ('elektronik', 'Elektronik', 'Temel elektronik, lehimleme ve PCB', '⚡', 2),
  ('yazilim', 'Yazılım', 'Web ve uygulama geliştirme', '💻', 3),
  ('tasarim', 'Tasarım', 'CAD ve aerodinamik (yakında)', '✏️', 4),
  ('pilot', 'Pilot', 'Uçuş ve görev (yakında)', '🎮', 5);

-- Ortak Temel modülleri + dersleri
with t as (select id from public.tracks where slug = 'ortak-temel'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Drone Temelleri', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Uçuş Kontrol & Kurulum', 2 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, 'Drone Nasıl Çalışır?', 'N_XneaFmOmU', 1 from m1
union all select id, 'Drone Teorisi 101 — Bölüm 1', 'K05UwsiqZ_E', 2 from m1
union all select id, 'DIY Drone Parçaları', 'h6q6tfqX3kA', 3 from m1
union all select id, 'PixHawk Kurulum & Kalibrasyon (1/5)', 'uH2iCRA9G7k', 1 from m2
union all select id, 'PixHawk Güç & İlk Uçuş (2/5)', 'CfQ-9MIHKkU', 2 from m2
union all select id, 'QGroundControl ile Uçuşa Giriş', 'z0a_rQZTbBg', 3 from m2
union all select id, 'Betaflight Detaylı Türkçe — Bölüm 1', 'kaYSmWefx3A', 4 from m2
union all select id, 'Betaflight Detaylı Türkçe — Bölüm 2', 'K-Khq7sYVcQ', 5 from m2;

-- Elektronik modülleri + dersleri
with t as (select id from public.tracks where slug = 'elektronik'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Temel Elektronik', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Lehimleme', 2 from t returning id),
     m3 as (insert into public.modules (track_id, ad, sira) select id, 'PCB Tasarımı (KiCad)', 3 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, '20 Dakikada Temel Elektronik', 'SoH3zCsASz8', 1 from m1
union all select id, 'Gerilim, Akım ve Direnç Nedir?', '_EMXLNe78xI', 2 from m1
union all select id, 'AC ve DC Nedir?', 'p00fpCollrk', 3 from m1
union all select id, 'Multimetre Nasıl Kullanılır?', '2FoECRTlxZg', 4 from m1
union all select id, 'Lehimlemeye Başlangıç Rehberi', '3jAw41LRBxU', 1 from m2
union all select id, 'Lehimlemede 10 Hata ve İpuçları', 'Fp37DPZVdRI', 2 from m2
union all select id, 'KiCad 1 — Giriş ve Kurulum', 'SsDTp9-GYYE', 1 from m3
union all select id, 'KiCad 2 — İş Akışı', 'exqsBBMrNF4', 2 from m3
union all select id, 'KiCad 3 — Şematik Oluşturma', 'rSYIbXPIGA4', 3 from m3
union all select id, 'KiCad 4 — Şematikten PCB''ye', 'aK56TuX-qW8', 4 from m3
union all select id, 'KiCad 5 — PCBnew', '9ySjwEOVa1Q', 5 from m3
union all select id, 'KiCad 6 — Gerber Çıktısı', 'UH3CRAJ5YFk', 6 from m3;

-- Yazılım modülleri + dersleri
with t as (select id from public.tracks where slug = 'yazilim'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Web Temelleri', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Modern Web', 2 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, 'HTML — Başlangıç Crash Course', '916GWv2Qs08', 1 from m1
union all select id, 'CSS — Tam Kurs', 'OXGznpKZ_sA', 2 from m1
union all select id, 'JavaScript — Tam Kurs', 'jS4aFq5-91M', 3 from m1
union all select id, 'React 18 + Redux Toolkit', '2-crBg6wpp0', 1 from m2
union all select id, 'Next.js — Tam Yığın Uygulama', 'KjY94sAKLlw', 2 from m2;
```

- [ ] **Step 2: [İNSAN] Supabase'de uygula**

Supabase → SQL Editor → New query → yukarıdaki içeriği yapıştır → Run.
Expected: "Success. Rows returned" / insert sayıları görünür.

Doğrulama (aynı editörde):
```sql
select t.ad as dal, count(l.id) as ders
from public.tracks t
left join public.modules m on m.track_id = t.id
left join public.lessons l on l.module_id = m.id
group by t.ad order by min(t.sira);
```
Expected: Ortak Temel=8, Elektronik=12, Yazılım=5, Tasarım=0, Pilot=0.

- [ ] **Step 3: [İNSAN] Canlı uçtan uca doğrula**

```bash
cd web && npm run dev -- -p 3000
```
Tarayıcıda giriş yaptıktan sonra:
- `/mufredat` → 5 dal, modüller ve dersler ✓/●/○ ile görünür; ilk ders ● (current).
- Bir derse gir → video oynar; ~%90 izleyince (veya "İzledim"e basınca) ders ✓ olur, "Sonraki ders" çalışır.
- `/panom` → "Kaldığın yerden devam et" en son tamamlanmamış dersi gösterir; toplam ilerleme yüzdesi artar.

Expected: Hepsi beklendiği gibi.

- [ ] **Step 4: Commit**

```bash
cd "/home/weslax83/stratos-akademi" && git add supabase/migrations/0003_seed_curriculum.sql && git commit -m "feat(curriculum): curated starter seed from playlists (real YouTube IDs)"
```

---

## Plan Tamamlandı — Sonraki Adımlar

Bu plan müfredat gezinme + video izleme + otomatik ilerlemeyi üretir. Sonraki planlar:
1. **Quiz** — quizzes/questions/quiz_attempts, çoktan seçmeli akış, otomatik puan; modül sonu quiz kartı ders sayfasına eklenir.
2. **Tam Dashboard** — istatistik halkaları, dal kartları, rozet/streak özetleri (mockup `dashboard.html`).
3. **Admin paneli** — içerik CRUD (dal/modül/ders) + üye/rol yönetimi.
4. (v2) Pratik görev gönderme+onay, rozetler, liderlik tablosu.
