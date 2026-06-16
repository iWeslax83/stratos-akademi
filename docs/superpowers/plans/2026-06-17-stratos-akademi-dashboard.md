# Stratos Akademi Tam Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/panom` sayfasını gerçek veriyle çalışan tam bento dashboard'a çıkarmak (kaldığın yer, ilerleme halkası, dal kartları, streak, puan, güvenli liderlik, dal yetkinlikleri).

**Architecture:** Saf/test edilebilir hesap fonksiyonları (`lib/dashboard/`) + tek `DashboardStats` nesnesi; sunum bileşenleri (`components/dashboard/`); liderlik için `SECURITY DEFINER` RPC; yetkinlik kalıcılığı için `user_competencies` tablosu + server action. Üç bağımsız faz.

**Tech Stack:** Next.js 16 (App Router, RSC + Server Actions), TypeScript, Tailwind v3, Supabase (Postgres + RLS + RPC), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-17-stratos-akademi-dashboard-design.md`

---

## Çalışma kuralları (executor için)

- Tüm komutlar `web/` dizininde çalışır (örn. `cd web && npm test`).
- Testler: `src/test/**/*.test.{ts,tsx}`, vitest globals açık (`describe/it/expect` import gerekmez ama mevcut testler import ediyor — aynısını yap).
- `@/` → `web/src/`.
- Migration dosyaları yazılır ama **uygulamayı kullanıcı yapar** (Supabase SQL editor). Migration görevlerinde kullanıcıdan SQL'i çalıştırmasını iste, sonra doğrula.
- Tailwind tokenları mevcut: `navy`, `navy-deep`, `navy-panel`, `gold`, `gold-soft`, `gold-dark`, `ink`, `muted`; `rounded-bezel`, `rounded-core`; CSS değişkenleri `var(--line)`, `var(--panel)`.
- Servis anahtarı (`SUPABASE_SERVICE_ROLE_KEY`) ASLA komut satırına/commit'e konmaz.

## Dosya Yapısı

**Yeni — saf hesap (`web/src/lib/dashboard/`):**
- `points.ts` — `computePoints(completedCount, bestQuizScores[])`
- `streak.ts` — `computeStreak(activityDates[], today)` + `istanbulDayKey`
- `competencies.ts` — `earnedCompetencies(perTrack[])`
- `stats.ts` — `DashboardStats` tipi + `buildStats(...)` birleştirici
- `queries.ts` — `getDashboardData(supabase, userId)` (DB okuma)
- `leaderboard.ts` — `getLeaderboard(supabase)` (RPC) + `LeaderRow`

**Değişen — müfredat katmanı:**
- `web/src/lib/curriculum/types.ts` — `TrackProgress` tipi eklenir
- `web/src/lib/curriculum/progress.ts` — `trackProgress`, `moduleProgress` eklenir

**Yeni — bileşenler (`web/src/components/dashboard/`):**
- `StatRing.tsx`, `StatCard.tsx`, `ResumeCard.tsx`, `TrackList.tsx`
- `LeaderboardMini.tsx`, `CompetencyShelf.tsx`, `CompetencyToast.tsx`

**Değişen — kabuk + sayfa:**
- `web/src/components/shell/Nav.tsx` — dinamik streak/puan çipi + linkler
- `web/src/components/shell/AppShell.tsx` — streak/points geçişi
- `web/src/app/panom/page.tsx` — bento'ya dönüşüm

**Yeni — rota + action + migration:**
- `web/src/app/liderlik/page.tsx`
- `web/src/app/actions/competencies.ts` — `syncCompetencies`
- `supabase/migrations/0008_leaderboard_rpc.sql`
- `supabase/migrations/0009_user_competencies.sql`

---

## Task 0: Dal aç

- [ ] **Step 1: feat/dashboard dalını oluştur**

```bash
cd /home/weslax83/stratos-akademi && git checkout -b feat/dashboard
```
Expected: `Switched to a new branch 'feat/dashboard'`

---

# FAZ 1 — Bento + türetilen istatistikler

## Task 1: TrackProgress tipi + trackProgress + moduleProgress

**Files:**
- Modify: `web/src/lib/curriculum/types.ts`
- Modify: `web/src/lib/curriculum/progress.ts`
- Test: `web/src/test/curriculum/trackProgress.test.ts`

- [ ] **Step 1: TrackProgress tipini ekle**

`web/src/lib/curriculum/types.ts` dosyasının sonuna ekle:

```ts
export type TrackProgress = {
  slug: string;
  ad: string;
  ikon: string | null;
  moduleCount: number;
  done: number;
  total: number;
  pct: number;
};
```

- [ ] **Step 2: Başarısız testi yaz**

`web/src/test/curriculum/trackProgress.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { trackProgress, moduleProgress } from "@/lib/curriculum/progress";
import type { Curriculum, Module } from "@/lib/curriculum/types";

const L = (id: string, sira: number, sure: number | null = null) => ({
  id,
  baslik: id,
  youtube_video_id: "v" + id,
  aciklama: null,
  sure_sn: sure,
  sira,
});

const curriculum: Curriculum = [
  {
    id: "t1",
    slug: "ortak-temel",
    ad: "Ortak Temel",
    aciklama: null,
    ikon: "🚀",
    sira: 1,
    modules: [
      { id: "m1", ad: "M1", aciklama: null, sira: 1, quiz: null, lessons: [L("a", 1), L("b", 2)] },
      { id: "m2", ad: "M2", aciklama: null, sira: 2, quiz: null, lessons: [L("c", 1)] },
    ],
  },
  {
    id: "t2",
    slug: "elektronik",
    ad: "Elektronik",
    aciklama: null,
    ikon: "⚡",
    sira: 2,
    modules: [{ id: "m3", ad: "M3", aciklama: null, sira: 1, quiz: null, lessons: [L("d", 1)] }],
  },
];

describe("trackProgress", () => {
  it("dal başına done/total/pct ve modül sayısı", () => {
    const r = trackProgress(curriculum, new Set(["a", "b"]));
    expect(r).toEqual([
      { slug: "ortak-temel", ad: "Ortak Temel", ikon: "🚀", moduleCount: 2, done: 2, total: 3, pct: 67 },
      { slug: "elektronik", ad: "Elektronik", ikon: "⚡", moduleCount: 1, done: 0, total: 1, pct: 0 },
    ]);
  });
  it("dersi olmayan dal pct 0", () => {
    const empty: Curriculum = [
      { id: "t", slug: "s", ad: "Boş", aciklama: null, ikon: null, sira: 1, modules: [] },
    ];
    expect(trackProgress(empty, new Set())[0].pct).toBe(0);
  });
});

describe("moduleProgress", () => {
  const mod: Module = {
    id: "m",
    ad: "M",
    aciklama: null,
    sira: 1,
    quiz: null,
    lessons: [L("x", 1, 100), L("y", 2, 120)],
  };
  it("tamamlanan oranı ve kalan süreyi (tamamlanmamış derslerin sure_sn toplamı) verir", () => {
    expect(moduleProgress(mod, new Set(["x"]))).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      kalanSure_sn: 120,
    });
  });
  it("hepsi tamamsa kalan 0", () => {
    expect(moduleProgress(mod, new Set(["x", "y"]))).toEqual({
      done: 2,
      total: 2,
      pct: 100,
      kalanSure_sn: 0,
    });
  });
});
```

- [ ] **Step 3: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/curriculum/trackProgress.test.ts`
Expected: FAIL — `trackProgress is not a function` / `moduleProgress is not a function`

- [ ] **Step 4: Fonksiyonları yaz**

`web/src/lib/curriculum/progress.ts` — import satırına `Module, TrackProgress` ekle ve dosya sonuna fonksiyonları ekle:

```ts
// import satırını şu hale getir:
import type { Curriculum, FlatLesson, LessonStatus, Module, TrackProgress } from "./types";

// ... mevcut fonksiyonlar ...

export function trackProgress(curriculum: Curriculum, completedIds: Set<string>): TrackProgress[] {
  return [...curriculum]
    .sort((a, b) => a.sira - b.sira)
    .map((track) => {
      let done = 0;
      let total = 0;
      for (const m of track.modules) {
        for (const l of m.lessons) {
          total++;
          if (completedIds.has(l.id)) done++;
        }
      }
      return {
        slug: track.slug,
        ad: track.ad,
        ikon: track.ikon,
        moduleCount: track.modules.length,
        done,
        total,
        pct: total ? Math.round((done / total) * 100) : 0,
      };
    });
}

export function moduleProgress(
  module: Module,
  completedIds: Set<string>,
): { done: number; total: number; pct: number; kalanSure_sn: number } {
  let done = 0;
  let kalanSure_sn = 0;
  const total = module.lessons.length;
  for (const l of module.lessons) {
    if (completedIds.has(l.id)) done++;
    else kalanSure_sn += l.sure_sn ?? 0;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, kalanSure_sn };
}
```

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/curriculum/trackProgress.test.ts`
Expected: PASS (4 test)

- [ ] **Step 6: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/curriculum/types.ts web/src/lib/curriculum/progress.ts web/src/test/curriculum/trackProgress.test.ts && git commit -m "feat(dashboard): trackProgress + moduleProgress + TrackProgress tipi"
```

---

## Task 2: Puan formülü (points.ts)

**Files:**
- Create: `web/src/lib/dashboard/points.ts`
- Test: `web/src/test/dashboard/points.test.ts`

- [ ] **Step 1: Başarısız testi yaz**

`web/src/test/dashboard/points.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computePoints } from "@/lib/dashboard/points";

describe("computePoints", () => {
  it("ders yok, quiz yok → 0", () => {
    expect(computePoints(0, [])).toBe(0);
  });
  it("8 ders × 20 + [90,75] → 325", () => {
    expect(computePoints(8, [90, 75])).toBe(325);
  });
  it("sadece dersler", () => {
    expect(computePoints(8, [])).toBe(160);
  });
  it("sadece quizler", () => {
    expect(computePoints(0, [90, 75])).toBe(165);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/points.test.ts`
Expected: FAIL — modül bulunamadı

- [ ] **Step 3: Implementasyon**

`web/src/lib/dashboard/points.ts`:

```ts
// Puan = tamamlanan ders sayısı × 20 + her quizin en iyi yüzde puanının toplamı.
export function computePoints(completedCount: number, bestQuizScores: number[]): number {
  return completedCount * 20 + bestQuizScores.reduce((sum, s) => sum + s, 0);
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/points.test.ts`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/points.ts web/src/test/dashboard/points.test.ts && git commit -m "feat(dashboard): computePoints (ders×20 + quiz en iyi yüzdeleri)"
```

---

## Task 3: Streak (streak.ts)

**Files:**
- Create: `web/src/lib/dashboard/streak.ts`
- Test: `web/src/test/dashboard/streak.test.ts`

- [ ] **Step 1: Başarısız testi yaz**

`web/src/test/dashboard/streak.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeStreak } from "@/lib/dashboard/streak";

const today = new Date("2026-06-17T09:00:00+03:00");
const d = (s: string) => new Date(s);

describe("computeStreak", () => {
  it("aktivite yoksa 0", () => {
    expect(computeStreak([], today)).toBe(0);
  });
  it("sadece bugün → 1", () => {
    expect(computeStreak([d("2026-06-17T08:00:00+03:00")], today)).toBe(1);
  });
  it("bugün + dün + evvelsi gün → 3", () => {
    expect(
      computeStreak(
        [
          d("2026-06-17T08:00:00+03:00"),
          d("2026-06-16T20:00:00+03:00"),
          d("2026-06-15T10:00:00+03:00"),
        ],
        today,
      ),
    ).toBe(3);
  });
  it("bugün boş ama dün+evvelsi var → korunur (1 gün tolerans) → 2", () => {
    expect(
      computeStreak(
        [d("2026-06-16T20:00:00+03:00"), d("2026-06-15T10:00:00+03:00")],
        today,
      ),
    ).toBe(2);
  });
  it("sadece 2 gün önce (boşluk) → 0", () => {
    expect(computeStreak([d("2026-06-15T10:00:00+03:00")], today)).toBe(0);
  });
  it("aynı gün birden çok aktivite tek gün sayılır → 1", () => {
    expect(
      computeStreak(
        [d("2026-06-17T08:00:00+03:00"), d("2026-06-17T20:00:00+03:00")],
        today,
      ),
    ).toBe(1);
  });
  it("UTC zaman damgası Türkiye gününe yuvarlanır (gece yarısı sınırı)", () => {
    // 2026-06-16T22:30Z = 2026-06-17T01:30 +03 → İstanbul günü 06-17 (bugün)
    expect(computeStreak([d("2026-06-16T22:30:00Z")], today)).toBe(1);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/streak.test.ts`
Expected: FAIL — modül bulunamadı

- [ ] **Step 3: Implementasyon**

`web/src/lib/dashboard/streak.ts`:

```ts
const TZ = "Europe/Istanbul";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Bir Date'i Türkiye saat diliminde "YYYY-MM-DD" gün anahtarına çevirir.
// (Türkiye 2016'dan beri sabit UTC+3; yaz saati yok → 24sa çıkarmak güvenli.)
export function istanbulDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Peş peşe aktif gün sayısı. En yeni aktif gün bugün veya dün olmalı (1 gün tolerans).
export function computeStreak(activityDates: Date[], today: Date): number {
  if (activityDates.length === 0) return 0;
  const days = new Set(activityDates.map(istanbulDayKey));

  let cursor = new Date(today.getTime());
  if (!days.has(istanbulDayKey(cursor))) {
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
    if (!days.has(istanbulDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(istanbulDayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }
  return streak;
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/streak.test.ts`
Expected: PASS (7 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/streak.ts web/src/test/dashboard/streak.test.ts && git commit -m "feat(dashboard): computeStreak (Türkiye TZ, 1 gün tolerans)"
```

---

## Task 4: Yetkinlikler (competencies.ts)

**Files:**
- Create: `web/src/lib/dashboard/competencies.ts`
- Test: `web/src/test/dashboard/competencies.test.ts`

- [ ] **Step 1: Başarısız testi yaz**

`web/src/test/dashboard/competencies.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { earnedCompetencies } from "@/lib/dashboard/competencies";
import type { TrackProgress } from "@/lib/curriculum/types";

const TP = (slug: string, pct: number, total = 3): TrackProgress => ({
  slug,
  ad: slug,
  ikon: null,
  moduleCount: 1,
  done: Math.round((pct / 100) * total),
  total,
  pct,
});

describe("earnedCompetencies", () => {
  it("pct 100 olan dalların slug'larını döner", () => {
    expect(earnedCompetencies([TP("a", 100), TP("b", 30), TP("c", 100)])).toEqual(["a", "c"]);
  });
  it("hiçbiri 100 değilse boş", () => {
    expect(earnedCompetencies([TP("a", 99), TP("b", 0)])).toEqual([]);
  });
  it("dersi olmayan dal (total 0) yetkinlik sayılmaz", () => {
    expect(earnedCompetencies([TP("bos", 0, 0)])).toEqual([]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/competencies.test.ts`
Expected: FAIL — modül bulunamadı

- [ ] **Step 3: Implementasyon**

`web/src/lib/dashboard/competencies.ts`:

```ts
import type { TrackProgress } from "@/lib/curriculum/types";

// Yetkinlik = bir dalın %100 tamamlanması. Dersi olmayan dal sayılmaz.
export function earnedCompetencies(perTrack: TrackProgress[]): string[] {
  return perTrack.filter((t) => t.total > 0 && t.pct === 100).map((t) => t.slug);
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/competencies.test.ts`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/competencies.ts web/src/test/dashboard/competencies.test.ts && git commit -m "feat(dashboard): earnedCompetencies (dal %100 tamamlama)"
```

---

## Task 5: DashboardStats + buildStats (stats.ts)

**Files:**
- Create: `web/src/lib/dashboard/stats.ts`
- Test: `web/src/test/dashboard/stats.test.ts`

- [ ] **Step 1: Başarısız testi yaz**

`web/src/test/dashboard/stats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildStats } from "@/lib/dashboard/stats";
import type { Curriculum } from "@/lib/curriculum/types";

const L = (id: string, sira: number) => ({
  id,
  baslik: id,
  youtube_video_id: "v" + id,
  aciklama: null,
  sure_sn: 60,
  sira,
});

const curriculum: Curriculum = [
  {
    id: "t1",
    slug: "ortak-temel",
    ad: "Ortak Temel",
    aciklama: null,
    ikon: "🚀",
    sira: 1,
    modules: [{ id: "m1", ad: "M1", aciklama: null, sira: 1, quiz: null, lessons: [L("a", 1), L("b", 2)] }],
  },
  {
    id: "t2",
    slug: "elektronik",
    ad: "Elektronik",
    aciklama: null,
    ikon: "⚡",
    sira: 2,
    modules: [{ id: "m2", ad: "M2", aciklama: null, sira: 1, quiz: null, lessons: [L("c", 1)] }],
  },
];

describe("buildStats", () => {
  it("tüm istatistikleri tek nesnede birleştirir", () => {
    const stats = buildStats({
      curriculum,
      completedIds: new Set(["a", "b"]), // ortak-temel %100
      bestQuizScores: [90, 75],
      activityDates: [new Date("2026-06-17T08:00:00+03:00")],
      today: new Date("2026-06-17T09:00:00+03:00"),
    });
    expect(stats.completedCount).toBe(2);
    expect(stats.points).toBe(205); // 2*20 + 90 + 75
    expect(stats.streak).toBe(1);
    expect(stats.overall).toEqual({ done: 2, total: 3, pct: 67 });
    expect(stats.earnedCompetencies).toEqual(["ortak-temel"]);
    expect(stats.perTrack.map((t) => t.slug)).toEqual(["ortak-temel", "elektronik"]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/stats.test.ts`
Expected: FAIL — modül bulunamadı

- [ ] **Step 3: Implementasyon**

`web/src/lib/dashboard/stats.ts`:

```ts
import type { Curriculum, TrackProgress } from "@/lib/curriculum/types";
import { overallProgress, trackProgress } from "@/lib/curriculum/progress";
import { computePoints } from "./points";
import { computeStreak } from "./streak";
import { earnedCompetencies } from "./competencies";

export type DashboardStats = {
  completedCount: number;
  bestQuizScores: number[];
  streak: number;
  points: number;
  perTrack: TrackProgress[];
  overall: { done: number; total: number; pct: number };
  earnedCompetencies: string[];
};

export function buildStats(input: {
  curriculum: Curriculum;
  completedIds: Set<string>;
  bestQuizScores: number[];
  activityDates: Date[];
  today: Date;
}): DashboardStats {
  const perTrack = trackProgress(input.curriculum, input.completedIds);
  const overall = overallProgress(input.curriculum, input.completedIds);
  return {
    completedCount: overall.done,
    bestQuizScores: input.bestQuizScores,
    streak: computeStreak(input.activityDates, input.today),
    points: computePoints(overall.done, input.bestQuizScores),
    perTrack,
    overall,
    earnedCompetencies: earnedCompetencies(perTrack),
  };
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/stats.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/stats.ts web/src/test/dashboard/stats.test.ts && git commit -m "feat(dashboard): DashboardStats + buildStats birleştirici"
```

---

## Task 6: Veri okuma (queries.ts)

**Files:**
- Create: `web/src/lib/dashboard/queries.ts`

Bu modül Supabase okuması yapar (entegrasyon); birim testi yerine sonraki sayfa entegrasyonunda dev sunucuyla doğrulanır. Mevcut `lib/curriculum/queries.ts` kalıbını izler.

- [ ] **Step 1: Implementasyon**

`web/src/lib/dashboard/queries.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

// Dashboard için kullanıcıya özel ham veriyi okur:
// tamamlanan ders id'leri, quiz başına en iyi puan, ve tüm aktivite tarihleri (streak için).
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ completedIds: Set<string>; bestQuizScores: number[]; activityDates: Date[] }> {
  const [{ data: prog }, { data: attempts }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase.from("quiz_attempts").select("quiz_id, puan, created_at").eq("user_id", userId),
  ]);

  const completedIds = new Set(
    (prog ?? []).map((r: { lesson_id: string }) => r.lesson_id),
  );

  // Quiz başına en iyi puan
  const best = new Map<string, number>();
  for (const a of (attempts ?? []) as { quiz_id: string; puan: number }[]) {
    best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? 0, a.puan));
  }
  const bestQuizScores = [...best.values()];

  // Aktivite tarihleri = ders tamamlama + quiz denemeleri
  const activityDates: Date[] = [];
  for (const r of (prog ?? []) as { completed_at: string | null }[]) {
    if (r.completed_at) activityDates.push(new Date(r.completed_at));
  }
  for (const a of (attempts ?? []) as { created_at: string }[]) {
    if (a.created_at) activityDates.push(new Date(a.created_at));
  }

  return { completedIds, bestQuizScores, activityDates };
}
```

- [ ] **Step 2: Tip kontrolü**

Run: `cd web && npx tsc --noEmit`
Expected: hata yok

- [ ] **Step 3: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/queries.ts && git commit -m "feat(dashboard): getDashboardData (ilerleme + en iyi quiz + aktivite tarihleri)"
```

---

## Task 7: Sunum bileşenleri — StatRing, StatCard, ResumeCard, TrackList

**Files:**
- Create: `web/src/components/dashboard/StatRing.tsx`
- Create: `web/src/components/dashboard/StatCard.tsx`
- Create: `web/src/components/dashboard/ResumeCard.tsx`
- Create: `web/src/components/dashboard/TrackList.tsx`
- Test: `web/src/test/dashboard/ResumeCard.test.tsx`

- [ ] **Step 1: StatRing**

`web/src/components/dashboard/StatRing.tsx`:

```tsx
export function StatRing({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-5 text-center">
      <div
        className="mb-2 grid h-16 w-16 place-items-center rounded-full"
        style={{ background: `conic-gradient(#c9a23a ${pct}%, rgba(100,112,138,0.25) 0)` }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--panel)] font-display text-sm font-extrabold text-navy dark:text-white">
          %{pct}
        </span>
      </div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
```

- [ ] **Step 2: StatCard**

`web/src/components/dashboard/StatCard.tsx`:

```tsx
import { clsx } from "clsx";

export function StatCard({
  icon,
  value,
  label,
  gold = false,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <div className="mb-2 text-lg">{icon}</div>
      <div
        className={clsx(
          "font-display text-3xl font-extrabold leading-none",
          gold ? "text-gold" : "text-navy dark:text-white",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
```

- [ ] **Step 3: ResumeCard testini yaz (başarısız)**

`web/src/test/dashboard/ResumeCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import type { FlatLesson } from "@/lib/curriculum/types";

const resume: FlatLesson = {
  lesson: { id: "l1", baslik: "Drone Nasıl Uçar?", youtube_video_id: "v", aciklama: null, sure_sn: 600, sira: 1 },
  module: { id: "m1", ad: "Modül 2", aciklama: null, sira: 2, quiz: null, lessons: [] },
  track: { id: "t1", slug: "ortak-temel", ad: "Ortak Temel", aciklama: null, ikon: "🚀", sira: 1, modules: [] },
};

describe("ResumeCard", () => {
  it("kaldığın ders başlığını ve modül ilerlemesini gösterir", () => {
    render(<ResumeCard resume={resume} modulePct={40} kalanDk={12} allDone={false} />);
    expect(screen.getByText("Drone Nasıl Uçar?")).toBeInTheDocument();
    expect(screen.getByText(/Modül %40 tamamlandı/)).toBeInTheDocument();
    expect(screen.getByText(/12 dk kaldı/)).toBeInTheDocument();
  });
  it("resume yoksa ve hepsi bittiyse kutlama gösterir", () => {
    render(<ResumeCard resume={null} modulePct={0} kalanDk={0} allDone={true} />);
    expect(screen.getByText(/Tüm dersleri tamamladın/)).toBeInTheDocument();
  });
  it("resume yoksa ve müfredat boşsa bilgilendirir", () => {
    render(<ResumeCard resume={null} modulePct={0} kalanDk={0} allDone={false} />);
    expect(screen.getByText(/Müfredat yakında/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/ResumeCard.test.tsx`
Expected: FAIL — modül bulunamadı

- [ ] **Step 5: ResumeCard**

`web/src/components/dashboard/ResumeCard.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { FlatLesson } from "@/lib/curriculum/types";

export function ResumeCard({
  resume,
  modulePct,
  kalanDk,
  allDone,
}: {
  resume: FlatLesson | null;
  modulePct: number;
  kalanDk: number;
  allDone: boolean;
}) {
  if (!resume) {
    return (
      <div className="flex h-full items-center justify-between gap-4 p-6">
        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
          {allDone ? "🎉 Tüm dersleri tamamladın!" : "Müfredat yakında eklenecek."}
        </p>
        {allDone && (
          <Link href="/mufredat">
            <Button variant="ghost">Müfredatı gör</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative m-[7px] grid aspect-[21/8] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(120%_140%_at_25%_15%,#1d2f52,#0a1424_72%)]">
        <span className="absolute left-3.5 top-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#cdd8ec]">
          Kaldığın yerden
        </span>
        <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-gold text-xl text-navy shadow-[0_16px_36px_-12px_rgba(201,162,58,0.6)]">
          ▶
        </span>
      </div>
      <div className="px-6 pb-6 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
          {resume.track.ad} · {resume.module.ad}
        </span>
        <h3 className="mb-3 mt-1 font-display text-xl font-bold text-navy dark:text-white">
          {resume.lesson.baslik}
        </h3>
        <div className="mb-2.5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-[#e6cf86]"
            style={{ width: `${modulePct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-muted">
            Modül %{modulePct} tamamlandı{kalanDk > 0 ? ` · ~${kalanDk} dk kaldı` : ""}
          </span>
          <Link href={`/mufredat/${resume.lesson.id}`}>
            <Button variant="primary" icon="→">
              Devam et
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/ResumeCard.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 7: TrackList**

`web/src/components/dashboard/TrackList.tsx`:

```tsx
import Link from "next/link";
import type { TrackProgress } from "@/lib/curriculum/types";

export function TrackList({ tracks }: { tracks: TrackProgress[] }) {
  return (
    <div className="p-6">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-bold text-navy dark:text-white">Öğrenme dalların</h2>
        <Link href="/mufredat" className="text-[12.5px] font-semibold text-muted">
          Tümü →
        </Link>
      </div>
      {tracks.length === 0 ? (
        <p className="text-sm text-muted">Müfredat yakında eklenecek.</p>
      ) : (
        tracks.map((t) => (
          <div
            key={t.slug}
            className="flex items-center gap-3.5 border-b border-[var(--line)] py-3 last:border-b-0"
          >
            <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-gold-soft text-[17px] dark:bg-gold-dark">
              {t.ikon ?? "•"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-navy dark:text-white">{t.ad}</div>
              <div className="text-xs text-muted">{t.moduleCount} modül</div>
            </div>
            <div className="ml-auto h-[7px] w-full max-w-[160px] flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${t.pct}%` }} />
            </div>
            <div className="w-9 shrink-0 text-right font-display text-[13px] font-bold text-navy dark:text-white">
              %{t.pct}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 8: Tip kontrolü + commit**

Run: `cd web && npx tsc --noEmit`
Expected: hata yok

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/dashboard/ web/src/test/dashboard/ResumeCard.test.tsx && git commit -m "feat(dashboard): StatRing, StatCard, ResumeCard, TrackList bileşenleri"
```

---

## Task 8: Nav/AppShell dinamikleştir + /panom bento'ya dönüştür

**Files:**
- Modify: `web/src/components/shell/Nav.tsx`
- Modify: `web/src/components/shell/AppShell.tsx`
- Modify: `web/src/app/panom/page.tsx`

- [ ] **Step 1: Nav — dinamik çip + linkler**

`web/src/components/shell/Nav.tsx` (tamamını değiştir):

```tsx
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Nav({
  initial = "E",
  streak,
  points,
}: {
  initial?: string;
  streak?: number;
  points?: number;
}) {
  return (
    <nav className="flex items-center gap-4 rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[rgba(20,32,56,0.6)]">
      <Link
        href="/panom"
        className="flex items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white"
      >
        <span className="text-gold">◆</span> STRATOS
        <span className="text-sm font-semibold text-muted">akademi</span>
      </Link>
      <div className="ml-2 hidden items-center gap-1 sm:flex">
        <Link href="/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Müfredat
        </Link>
        <Link href="/panom" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Panom
        </Link>
        <Link href="/liderlik" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Liderlik
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        {streak != null && <Chip>🔥 {streak} gün</Chip>}
        {points != null && <Chip gold>⭐ {points} puan</Chip>}
        <ThemeToggle />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-gold dark:text-navy">
          {initial}
        </span>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: AppShell — streak/points geçişi**

`web/src/components/shell/AppShell.tsx` (tamamını değiştir):

```tsx
import { Nav } from "./Nav";

export function AppShell({
  children,
  initial,
  streak,
  points,
}: {
  children: React.ReactNode;
  initial?: string;
  streak?: number;
  points?: number;
}) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-6">
      <Nav initial={initial} streak={streak} points={points} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: /panom — bento (Faz 1 hücreleri)**

`web/src/app/panom/page.tsx` (tamamını değiştir). Liderlik ve yetkinlik hücreleri Faz 2/3'te eklenecek; şimdilik kaldığın yer + halka + streak + puan + dallar:

```tsx
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatRing } from "@/components/dashboard/StatRing";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { TrackList } from "@/components/dashboard/TrackList";
import { getCurriculum } from "@/lib/curriculum/queries";
import { flatten, resumeLessonId, moduleProgress } from "@/lib/curriculum/progress";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildStats } from "@/lib/dashboard/stats";

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
  const { completedIds, bestQuizScores, activityDates } = await getDashboardData(supabase, user!.id);
  const stats = buildStats({
    curriculum,
    completedIds,
    bestQuizScores,
    activityDates,
    today: new Date(),
  });

  // Kaldığın yer + modül ilerlemesi
  const resumeId = resumeLessonId(curriculum, completedIds);
  const resume = resumeId ? flatten(curriculum).find((f) => f.lesson.id === resumeId) ?? null : null;
  const modProg = resume ? moduleProgress(resume.module, completedIds) : null;
  const kalanDk = modProg ? Math.ceil(modProg.kalanSure_sn / 60) : 0;
  const allDone = curriculum.length > 0 && resume === null;

  return (
    <AppShell initial={initial} streak={stats.streak} points={stats.points}>
      <div className="mb-5">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad} 👋
        </h1>
        <p className="mt-1.5 text-muted">
          Toplam ilerleme: {stats.overall.done}/{stats.overall.total} ders · %{stats.overall.pct}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <ResumeCard
            resume={resume}
            modulePct={modProg?.pct ?? 0}
            kalanDk={kalanDk}
            allDone={allDone}
          />
        </Card>

        <div className="grid grid-cols-2 gap-[18px] lg:col-span-5">
          <Card>
            <StatRing pct={stats.overall.pct} label="Toplam ilerleme" />
          </Card>
          <Card>
            <StatCard icon="🔥" value={stats.streak} label="Günlük seri (gün)" />
          </Card>
          <Card className="col-span-2">
            <StatCard icon="⭐" value={stats.points} label="Toplam puan" gold />
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <TrackList tracks={stats.perTrack} />
        </Card>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Build doğrula**

Run: `cd web && npx tsc --noEmit && npm run test`
Expected: tsc temiz; tüm vitest testleri PASS

- [ ] **Step 5: Dev sunucuda elle doğrula**

Dev sunucu çalışıyorsa http://localhost:3000/panom aç (değilse `cd web && npm run dev`). Kontrol: bento görünüyor, kaldığın yer kartı doğru ders, halka yüzdesi, streak ve puan çipleri Nav'da, dal kartları ilerleme barlarıyla. Konsol hatası yok.

- [ ] **Step 6: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/shell/Nav.tsx web/src/components/shell/AppShell.tsx web/src/app/panom/page.tsx && git commit -m "feat(dashboard): /panom bento layout + dinamik Nav (streak/puan/linkler)"
```

---

# FAZ 2 — Liderlik

## Task 9: Liderlik RPC göçü (0008)

**Files:**
- Create: `supabase/migrations/0008_leaderboard_rpc.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0008_leaderboard_rpc.sql`:

```sql
-- Liderlik: diğer üyelerin puanını okumak RLS'i aşar → SECURITY DEFINER fonksiyon.
-- Yalnız görünen ad ("Ad S.") + puan + sıra döner; e-posta asla dışarı çıkmaz.
create or replace function public.leaderboard()
returns table (user_id uuid, gorunen_ad text, puan int, sira bigint)
language sql
security definer
set search_path = public
as $$
  with ders as (
    select user_id, count(*) * 20 as p
    from lesson_progress where completed = true group by user_id
  ),
  quiz as (
    select user_id, sum(best)::int as p from (
      select user_id, quiz_id, max(puan) as best
      from quiz_attempts group by user_id, quiz_id
    ) t group by user_id
  ),
  toplam as (
    select p.id as user_id,
           coalesce(d.p,0) + coalesce(q.p,0) as puan,
           p.ad
    from profiles p
    left join ders d on d.user_id = p.id
    left join quiz q on q.user_id = p.id
  )
  select user_id,
         case
           when coalesce(nullif(trim(ad), ''), '') = '' then 'Üye'
           when position(' ' in trim(ad)) = 0 then trim(ad)
           else split_part(trim(ad), ' ', 1) || ' ' ||
                upper(left(split_part(trim(ad), ' ', 2), 1)) || '.'
         end as gorunen_ad,
         puan,
         rank() over (order by puan desc) as sira
  from toplam
  order by puan desc;
$$;

revoke execute on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
```

- [ ] **Step 2: Kullanıcı SQL'i uygulasın**

Kullanıcıdan iste: bu dosyanın içeriğini Supabase SQL editor'da çalıştırsın. Çalıştırınca "Success. No rows returned" beklenir.

- [ ] **Step 3: RPC'yi doğrula (kullanıcı SQL editor'da)**

Kullanıcıdan SQL editor'da çalıştırmasını iste:
```sql
select * from public.leaderboard();
```
Expected: her profil için `gorunen_ad` "Ad S." formatında, `puan` doğru, `sira` puana göre azalan; satırlarda e-posta YOK.

- [ ] **Step 4: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0008_leaderboard_rpc.sql && git commit -m "feat(dashboard): leaderboard() güvenli RPC göçü (0008)"
```

---

## Task 10: Liderlik veri + bileşen + /liderlik sayfa + bento'ya ekle

**Files:**
- Create: `web/src/lib/dashboard/leaderboard.ts`
- Create: `web/src/components/dashboard/LeaderboardMini.tsx`
- Create: `web/src/app/liderlik/page.tsx`
- Modify: `web/src/app/panom/page.tsx`
- Test: `web/src/test/dashboard/LeaderboardMini.test.tsx`

- [ ] **Step 1: leaderboard.ts**

`web/src/lib/dashboard/leaderboard.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderRow = { userId: string; gorunenAd: string; puan: number; sira: number };

export async function getLeaderboard(supabase: SupabaseClient): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard");
  if (error || !data) {
    if (error) console.error("getLeaderboard RPC hatası:", error);
    return [];
  }
  return (data as { user_id: string; gorunen_ad: string; puan: number; sira: number }[]).map((r) => ({
    userId: r.user_id,
    gorunenAd: r.gorunen_ad,
    puan: r.puan,
    sira: Number(r.sira),
  }));
}
```

- [ ] **Step 2: LeaderboardMini testini yaz (başarısız)**

`web/src/test/dashboard/LeaderboardMini.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardMini } from "@/components/dashboard/LeaderboardMini";
import type { LeaderRow } from "@/lib/dashboard/leaderboard";

const rows: LeaderRow[] = [
  { userId: "u1", gorunenAd: "Demir Ö.", puan: 2150, sira: 1 },
  { userId: "u2", gorunenAd: "Berke A.", puan: 1780, sira: 2 },
  { userId: "u3", gorunenAd: "Erdem G.", puan: 1510, sira: 3 },
  { userId: "u4", gorunenAd: "Sen", puan: 1240, sira: 4 },
];

describe("LeaderboardMini", () => {
  it("ilk 3'ü ve top3 dışındaysam beni gösterir", () => {
    render(<LeaderboardMini rows={rows} meUserId="u4" />);
    expect(screen.getByText("Demir Ö.")).toBeInTheDocument();
    expect(screen.getByText("Erdem G.")).toBeInTheDocument();
    expect(screen.getByText("Sen")).toBeInTheDocument(); // 4. sıradaki ben
  });
  it("boş listede yüklenemedi mesajı", () => {
    render(<LeaderboardMini rows={[]} meUserId="u4" />);
    expect(screen.getByText(/yüklenemedi/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/LeaderboardMini.test.tsx`
Expected: FAIL — modül bulunamadı

- [ ] **Step 4: LeaderboardMini**

`web/src/components/dashboard/LeaderboardMini.tsx`:

```tsx
import Link from "next/link";
import { clsx } from "clsx";
import type { LeaderRow } from "@/lib/dashboard/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

function Row({ row, medal, me }: { row: LeaderRow; medal?: string; me: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0",
        me && "-mx-2.5 rounded-xl border-b-0 bg-gold-soft px-2.5 dark:bg-gold-dark",
      )}
    >
      <span className="w-6 text-center font-display text-sm font-extrabold text-muted">
        {medal ?? row.sira}
      </span>
      <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-navy text-xs font-bold text-white dark:bg-gold dark:text-navy">
        {row.gorunenAd.charAt(0)}
      </span>
      <span className="flex-1 text-[13.5px] font-bold text-navy dark:text-white">{row.gorunenAd}</span>
      <span className="font-display text-[13px] font-bold text-[#8a6d12] dark:text-[#ffd54a]">
        {row.puan}
      </span>
    </div>
  );
}

export function LeaderboardMini({ rows, meUserId }: { rows: LeaderRow[]; meUserId: string }) {
  return (
    <div className="p-6">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-bold text-navy dark:text-white">Liderlik</h2>
        <Link href="/liderlik" className="text-[12.5px] font-semibold text-muted">
          Tablo →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Liderlik şu an yüklenemedi.</p>
      ) : (
        <>
          {rows.slice(0, 3).map((r, i) => (
            <Row key={r.userId} row={r} medal={MEDALS[i]} me={r.userId === meUserId} />
          ))}
          {(() => {
            const me = rows.find((r) => r.userId === meUserId);
            return me && me.sira > 3 ? <Row row={me} me /> : null;
          })()}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/LeaderboardMini.test.tsx`
Expected: PASS (2 test)

- [ ] **Step 6: /liderlik tam sayfa**

`web/src/app/liderlik/page.tsx`:

```tsx
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LiderlikPage() {
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

  const rows = await getLeaderboard(supabase);

  return (
    <AppShell initial={initial}>
      <div className="mb-5">
        <Eyebrow>Liderlik</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Sıralama Tablosu
        </h1>
        <p className="mt-1.5 text-muted">Ders ve quizlerden topladığın puana göre.</p>
      </div>

      <Card className="p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Liderlik şu an yüklenemedi.</p>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.userId}
              className={clsx(
                "flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0",
                r.userId === user!.id && "-mx-3 rounded-xl border-b-0 bg-gold-soft px-3 dark:bg-gold-dark",
              )}
            >
              <span className="w-7 text-center font-display text-sm font-extrabold text-muted">
                {MEDALS[i] ?? r.sira}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white dark:bg-gold dark:text-navy">
                {r.gorunenAd.charAt(0)}
              </span>
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">
                {r.gorunenAd}
                {r.userId === user!.id && " (sen)"}
              </span>
              <span className="font-display text-sm font-bold text-[#8a6d12] dark:text-[#ffd54a]">
                {r.puan} puan
              </span>
            </div>
          ))
        )}
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 7: /panom bento'ya LeaderboardMini ekle**

`web/src/app/panom/page.tsx` içinde:

İmport ekle (diğer importların yanına):
```tsx
import { LeaderboardMini } from "@/components/dashboard/LeaderboardMini";
import { getLeaderboard } from "@/lib/dashboard/leaderboard";
```

`buildStats(...)` çağrısından sonra ekle:
```tsx
  const leaderboard = await getLeaderboard(supabase);
```

TrackList kartından sonra (grid içinde, son hücre olarak) ekle:
```tsx
        <Card className="lg:col-span-5">
          <LeaderboardMini rows={leaderboard} meUserId={user!.id} />
        </Card>
```

- [ ] **Step 8: Build + test + elle doğrula**

Run: `cd web && npx tsc --noEmit && npm run test`
Expected: temiz, tüm testler PASS

Dev sunucuda: /panom'da mini liderlik göründü (sen vurgulu), /liderlik tam tablo açılıyor, Nav "Liderlik" linki çalışıyor.

- [ ] **Step 9: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/leaderboard.ts web/src/components/dashboard/LeaderboardMini.tsx web/src/app/liderlik/page.tsx web/src/app/panom/page.tsx web/src/test/dashboard/LeaderboardMini.test.tsx && git commit -m "feat(dashboard): liderlik (RPC veri + mini tablo + /liderlik sayfa)"
```

---

# FAZ 3 — Yetkinlikler

## Task 11: user_competencies göçü (0009)

**Files:**
- Create: `supabase/migrations/0009_user_competencies.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0009_user_competencies.sql`:

```sql
-- Kazanılan dal yetkinlikleri (kalıcı + earned_at). badge_key yerine track_slug.
create table if not exists public.user_competencies (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, track_slug)
);

alter table public.user_competencies enable row level security;

create policy "yetkinlik kendi okunur" on public.user_competencies
  for select to authenticated using (auth.uid() = user_id);
create policy "yetkinlik kendi eklenir" on public.user_competencies
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.user_competencies to authenticated;
```

- [ ] **Step 2: Kullanıcı SQL'i uygulasın**

Kullanıcıdan iste: bu dosyayı Supabase SQL editor'da çalıştırsın. "Success. No rows returned" beklenir.

- [ ] **Step 3: Doğrula (kullanıcı SQL editor'da)**

```sql
select * from public.user_competencies;
```
Expected: boş tablo, hata yok (tablo ve RLS mevcut).

- [ ] **Step 4: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0009_user_competencies.sql && git commit -m "feat(dashboard): user_competencies tablosu + RLS (0009)"
```

---

## Task 12: syncCompetencies server action

**Files:**
- Create: `web/src/app/actions/competencies.ts`

Not: Bu action içinde `auth.getUser()` ÇAĞIRMA (quiz'deki refresh-token rotasyon yarışını önlemek için — hafıza: auth dersleri). `userId` parametre olarak gelir; güvenlik RLS `with check (auth.uid() = user_id)` ile sağlanır.

- [ ] **Step 1: Implementasyon**

`web/src/app/actions/competencies.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

// Kazanılan dal yetkinliklerini kalıcılaştırır; yalnız YENİ eklenenleri döner (bildirim için).
export async function syncCompetencies(
  userId: string,
  earnedSlugs: string[],
): Promise<{ yeni: string[] }> {
  try {
    if (earnedSlugs.length === 0) return { yeni: [] };
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("user_competencies")
      .select("track_slug")
      .eq("user_id", userId);
    const have = new Set((existing ?? []).map((r: { track_slug: string }) => r.track_slug));

    const yeni = earnedSlugs.filter((s) => !have.has(s));
    if (yeni.length > 0) {
      const { error } = await supabase
        .from("user_competencies")
        .insert(yeni.map((track_slug) => ({ user_id: userId, track_slug })));
      if (error) {
        console.error("syncCompetencies insert hatası:", error);
        return { yeni: [] };
      }
    }
    return { yeni };
  } catch (e) {
    console.error("syncCompetencies beklenmeyen hata:", e);
    return { yeni: [] };
  }
}
```

- [ ] **Step 2: Tip kontrolü + commit**

Run: `cd web && npx tsc --noEmit`
Expected: hata yok

```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/actions/competencies.ts && git commit -m "feat(dashboard): syncCompetencies server action"
```

---

## Task 13: CompetencyShelf + CompetencyToast + bento'ya bağla

**Files:**
- Create: `web/src/components/dashboard/CompetencyShelf.tsx`
- Create: `web/src/components/dashboard/CompetencyToast.tsx`
- Modify: `web/src/app/panom/page.tsx`
- Test: `web/src/test/dashboard/CompetencyShelf.test.tsx`

- [ ] **Step 1: CompetencyShelf testini yaz (başarısız)**

`web/src/test/dashboard/CompetencyShelf.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";

const tracks = [
  { slug: "ortak-temel", ad: "Ortak Temel", ikon: "🚀" },
  { slug: "elektronik", ad: "Elektronik", ikon: "⚡" },
  { slug: "yazilim", ad: "Yazılım", ikon: "💻" },
];

describe("CompetencyShelf", () => {
  it("kazanılan/toplam sayısını ve sıralamayı gösterir", () => {
    render(<CompetencyShelf tracks={tracks} earned={["ortak-temel", "elektronik"]} rank={4} />);
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
  });
  it("rank null ise sıralama gizli", () => {
    render(<CompetencyShelf tracks={tracks} earned={[]} rank={null} />);
    expect(screen.getByText(/0 \/ 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Sıralaman/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/dashboard/CompetencyShelf.test.tsx`
Expected: FAIL — modül bulunamadı

- [ ] **Step 3: CompetencyShelf**

`web/src/components/dashboard/CompetencyShelf.tsx`:

```tsx
import { clsx } from "clsx";

export function CompetencyShelf({
  tracks,
  earned,
  rank,
}: {
  tracks: { slug: string; ad: string; ikon: string | null }[];
  earned: string[];
  rank: number | null;
}) {
  const earnedSet = new Set(earned);
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div>
        <div className="mb-2 text-lg">🏅</div>
        <div className="text-xs font-semibold text-muted">
          Yetkinliklerin · {earned.length} / {tracks.length}
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {tracks.map((t) => {
            const has = earnedSet.has(t.slug);
            return (
              <span
                key={t.slug}
                title={t.ad}
                className={clsx(
                  "grid h-10 w-10 place-items-center rounded-xl border text-lg",
                  has
                    ? "border-[#efdfa8] bg-gold-soft dark:border-gold-dark dark:bg-gold-dark"
                    : "border-[var(--line)] bg-black/[0.04] opacity-50 grayscale dark:bg-white/[0.04]",
                )}
              >
                {has ? t.ikon ?? "✓" : "🔒"}
              </span>
            );
          })}
        </div>
      </div>
      {rank != null && (
        <div className="flex flex-col items-end">
          <div className="font-display text-3xl font-extrabold text-navy dark:text-white">#{rank}</div>
          <div className="text-xs font-semibold text-muted">Sıralaman</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/dashboard/CompetencyShelf.test.tsx`
Expected: PASS (2 test)

- [ ] **Step 5: CompetencyToast (client)**

`web/src/components/dashboard/CompetencyToast.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function CompetencyToast({ adlar }: { adlar: string[] }) {
  const [show, setShow] = useState(adlar.length > 0);
  useEffect(() => {
    if (adlar.length === 0) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [adlar.length]);

  if (!show || adlar.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-core border border-[#efdfa8] bg-gold-soft px-5 py-4 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)] dark:border-gold-dark dark:bg-gold-dark">
      <div className="font-display text-sm font-bold text-[#8a6d12] dark:text-[#ffd54a]">
        🎉 Yeni yetkinlik!
      </div>
      <div className="mt-1 text-sm font-semibold text-navy dark:text-white">{adlar.join(", ")}</div>
    </div>
  );
}
```

- [ ] **Step 6: /panom — yetkinlik senkron + shelf + toast**

`web/src/app/panom/page.tsx` içinde:

İmport ekle:
```tsx
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";
import { CompetencyToast } from "@/components/dashboard/CompetencyToast";
import { syncCompetencies } from "@/app/actions/competencies";
```

`leaderboard` çağrısından sonra ekle (yeni yetkinlikleri kaydet, kendi sıramı bul, yeni adları çöz):
```tsx
  const { yeni } = await syncCompetencies(user!.id, stats.earnedCompetencies);
  const myRank = leaderboard.find((r) => r.userId === user!.id)?.sira ?? null;
  const trackBySlug = new Map(stats.perTrack.map((t) => [t.slug, t.ad]));
  const yeniAdlar = yeni.map((s) => trackBySlug.get(s) ?? s);
```

Stats sütununda puan kartını (`col-span-2` StatCard ⭐) **CompetencyShelf ile değiştir** (puan zaten Nav çipinde):
```tsx
          <Card className="col-span-2">
            <CompetencyShelf
              tracks={stats.perTrack.map((t) => ({ slug: t.slug, ad: t.ad, ikon: t.ikon }))}
              earned={stats.earnedCompetencies}
              rank={myRank}
            />
          </Card>
```

AppShell'i kapatan etiketten hemen önce toast ekle:
```tsx
      <CompetencyToast adlar={yeniAdlar} />
```
(AppShell çocuğu olarak, grid'den sonra.)

- [ ] **Step 7: Build + test + elle doğrula**

Run: `cd web && npx tsc --noEmit && npm run test`
Expected: temiz, tüm testler PASS

Dev sunucuda elle: bir dalın tüm derslerini bitir → /panom'da o dalın yetkinliği ✓ olur, ilk açılışta "🎉 Yeni yetkinlik: <Dal>" toast çıkar; sayfayı yenile → toast bir daha çıkmaz (kalıcı kaydedildi). Sıralama #N görünür.

- [ ] **Step 8: Commit**

```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/dashboard/CompetencyShelf.tsx web/src/components/dashboard/CompetencyToast.tsx web/src/app/panom/page.tsx web/src/test/dashboard/CompetencyShelf.test.tsx && git commit -m "feat(dashboard): yetkinlik rafı + kazanma bildirimi + senkron"
```

---

## Task 14: Tam doğrulama + main'e birleştir

- [ ] **Step 1: Tüm testler + build**

Run: `cd web && npm run test && npm run build`
Expected: tüm testler PASS; production build başarılı

- [ ] **Step 2: Uçtan uca elle kontrol listesi (dev sunucu)**

- /panom bento eksiksiz: kaldığın yer, halka, streak, puan (Nav çipi), dallar, liderlik, yetkinlikler.
- Nav linkleri: Müfredat / Panom / Liderlik çalışıyor.
- /liderlik tam tablo, sen vurgulu, e-posta görünmüyor.
- Streak doğru (bugün ders/quiz yaptıysan ≥1).
- Karanlık tema tüm yeni bileşenlerde düzgün.
- Konsol/sunucu logunda hata yok.

- [ ] **Step 3: main'e birleştir**

```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/dashboard -m "Merge feat/dashboard: tam bento dashboard (streak/puan + güvenli liderlik + dal yetkinlikleri)" && git push origin main
```
Expected: merge + push başarılı

- [ ] **Step 4: Hafızayı güncelle**

`stratos-akademi-platform.md` memory dosyasına "v1 Dashboard TAMAM" bölümü ekle (fazlar, puan/streak formülü, liderlik RPC, user_competencies); "Sıradaki plan"ı Admin paneline güncelle.

---

## Spec Kapsam Kontrolü (öz-değerlendirme)

- Puan formülü → Task 2 ✓ · Streak → Task 3 ✓ · Yetkinlik kuralı → Task 4 ✓
- DashboardStats tek nesne → Task 5 ✓ · Veri okuma → Task 6 ✓
- Bento + kaldığın yer (modül ilerleme/kalan süre) + halka + dal kartları → Task 7, 8 ✓
- Nav dinamik streak/puan + Liderlik linki → Task 8 ✓
- Liderlik RPC ("Ad S.", e-posta yok, sadece authenticated) → Task 9 ✓
- Liderlik mini + /liderlik sayfa → Task 10 ✓
- user_competencies tablo + RLS → Task 11 ✓ · syncCompetencies → Task 12 ✓
- Yetkinlik rafı + kazanma anı bildirimi → Task 13 ✓
- Hata yönetimi (RPC/sync güvenli düşüş) → Task 10, 12 ✓
- Testler (points, streak, competencies, trackProgress, buildStats + bileşen testleri) → Task 1-7, 10, 13 ✓
```
