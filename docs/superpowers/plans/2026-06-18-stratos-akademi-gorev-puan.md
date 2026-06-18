# Pratik Görev Puan Entegrasyonu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Onaylı pratik görevlerin üye puanına (dashboard + liderlik) katkı vermesi.

**Architecture:** practical_tasks.puan kolonu; computePoints 3. argüman; getDashboardData onaylı görev puanı toplar; leaderboard RPC'ye görev CTE'si (0014). Geriye uyumlu.

**Tech Stack:** Next.js 16, TypeScript, Supabase (RLS + RPC), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-18-stratos-akademi-gorev-puan-design.md`

---

## Çalışma kuralları
Komutlar `web/` içinde. `@/`→`web/src/`. Migration'ı kullanıcı SQL editörde uygular. `any` kullanma.

## Task 0: Dal aç
- [ ] `cd /home/weslax83/stratos-akademi && git checkout -b feat/gorev-puan && git branch --show-current` → `feat/gorev-puan`

---

## Task 1: computePoints 3. argüman (TDD)

**Files:** Modify `web/src/lib/dashboard/points.ts`, `web/src/test/dashboard/points.test.ts`

- [ ] **Step 1: Testi güncelle** — `web/src/test/dashboard/points.test.ts` (tamamını değiştir):
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
  it("onaylı görev puanı eklenir", () => {
    expect(computePoints(8, [90, 75], 60)).toBe(385);
    expect(computePoints(0, [], 30)).toBe(30);
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/dashboard/points.test.ts` → onaylı-görev testi FAIL (3. arg yok sayılıyor).

- [ ] **Step 3: Implementasyon** — `web/src/lib/dashboard/points.ts` (tamamını değiştir):
```ts
// Puan = tamamlanan ders × 20 + quiz en iyi yüzdeleri + onaylı görev puanı.
export function computePoints(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): number {
  return completedCount * 20 + bestQuizScores.reduce((sum, s) => sum + s, 0) + approvedTaskPoints;
}
```

- [ ] **Step 4: Geçtiğini doğrula** — aynı vitest komutu → PASS (5 test).

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/points.ts web/src/test/dashboard/points.test.ts && git commit -m "feat(gorev): computePoints onaylı görev puanı argümanı"
```

---

## Task 2: Migration 0014 (puan kolonu + leaderboard RPC)

**Files:** Create `supabase/migrations/0014_task_points.sql` (spec'teki SQL birebir).

- [ ] **Step 1:** Dosyayı spec'teki `0014_task_points.sql` içeriğiyle oluştur.
- [ ] **Step 2:** Kullanıcı SQL editörde çalıştırır (sonda toplu).
- [ ] **Step 3: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0014_task_points.sql && git commit -m "feat(gorev): puan kolonu + leaderboard RPC görev puanı (0014)"
```

---

## Task 3: getDashboardData + buildStats + panom

**Files:** Modify `web/src/lib/dashboard/queries.ts`, `web/src/lib/dashboard/stats.ts`, `web/src/test/dashboard/stats.test.ts`, `web/src/app/panom/page.tsx`

- [ ] **Step 1: queries.ts** — `getDashboardData` dönüşüne `approvedTaskPoints` ekle. Fonksiyonun sonundaki `return` öncesine ekle:
```ts
  const { data: approved } = await supabase
    .from("task_submissions")
    .select("practical_tasks(puan)")
    .eq("user_id", userId)
    .eq("durum", "onay");
  type ApprovedRow = { practical_tasks: { puan: number } | { puan: number }[] | null };
  let approvedTaskPoints = 0;
  for (const r of (approved ?? []) as unknown as ApprovedRow[]) {
    const pt = Array.isArray(r.practical_tasks) ? r.practical_tasks[0]?.puan : r.practical_tasks?.puan;
    approvedTaskPoints += pt ?? 0;
  }
```
Ve dönüş tipini + return nesnesini güncelle: dönüş `Promise<{ completedIds: Set<string>; bestQuizScores: number[]; activityDates: Date[]; approvedTaskPoints: number }>`, return'e `approvedTaskPoints` ekle.

- [ ] **Step 2: stats.ts** — `buildStats` input'una `approvedTaskPoints: number` ekle; `points` satırını `computePoints(overall.done, input.bestQuizScores, input.approvedTaskPoints)` yap.

- [ ] **Step 3: stats.test.ts** — buildStats çağrısına `approvedTaskPoints: 50` ekle ve `expect(stats.points).toBe(255)` yap (2*20+90+75+50). Diğer assertion'lar aynı kalır.

- [ ] **Step 4: panom** — `web/src/app/panom/page.tsx`:
  - destructure: `const { completedIds, bestQuizScores, activityDates, approvedTaskPoints } = await getDashboardData(supabase, user!.id);`
  - buildStats çağrısına `approvedTaskPoints,` ekle.

- [ ] **Step 5: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test
```
PASS sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/dashboard/queries.ts web/src/lib/dashboard/stats.ts web/src/test/dashboard/stats.test.ts web/src/app/panom/page.tsx && git commit -m "feat(gorev): dashboard puanına onaylı görev puanı"
```

---

## Task 4: Görev puan alanı — tip + sorgular + actions

**Files:** Modify `web/src/lib/tasks/queries.ts`, `web/src/app/actions/tasks.ts`

- [ ] **Step 1: queries.ts** — `PracticalTask` tipine `puan: number` ekle; `getModuleTasks` içindeki `.select("id, baslik, aciklama, sira")` → `.select("id, baslik, aciklama, sira, puan")`.

- [ ] **Step 2: actions/tasks.ts** — `createTask` insert nesnesine `puan: intOr(fd, "puan", 30),` ekle; `updateTask` update nesnesine `puan: intOr(fd, "puan", 30),` ekle.

- [ ] **Step 3: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit
```
sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/tasks/queries.ts web/src/app/actions/tasks.ts && git commit -m "feat(gorev): görev puan alanı (tip + select + action)"
```

---

## Task 5: Görev puan UI — TaskForm + listeler

**Files:** Modify `web/src/components/admin/TaskForm.tsx`, `web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx`, `web/src/app/mufredat/gorevler/[moduleId]/page.tsx`

- [ ] **Step 1: TaskForm** — `Task` tipine `puan: number` ekle; "Sıra" alanından önce "Puan" alanı ekle:
```tsx
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Puan</span>
        <input
          name="puan"
          type="number"
          defaultValue={String(editing?.puan ?? 30)}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
```

- [ ] **Step 2: Admin görev listesi** — `gorevler/page.tsx`'te `type Task` satırına `puan: number` ekle; select `"id, baslik, aciklama, sira"` → `"id, baslik, aciklama, sira, puan"`; liste satırında başlıktan sonra puan göster:
```tsx
              <span className="flex-1 text-sm font-bold text-navy dark:text-white">
                {t.baslik} <span className="text-xs font-normal text-muted">· {t.puan} puan</span>
              </span>
```

- [ ] **Step 3: Üye görev kartı** — `mufredat/gorevler/[moduleId]/page.tsx`'te görev başlığı `<h3>` satırının altına puan rozeti ekle:
```tsx
              <span className="text-xs font-semibold text-gold">{task.puan} puan</span>
```
(h3 ile açıklama arasında.)

- [ ] **Step 4: Doğrula + commit**
```bash
cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test && npm run build
```
PASS/başarılı sonra:
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/TaskForm.tsx "web/src/app/admin/mufredat/[trackId]/[moduleId]/gorevler/page.tsx" "web/src/app/mufredat/gorevler/[moduleId]/page.tsx" && git commit -m "feat(gorev): görev puanı UI (TaskForm + admin/üye listeler)"
```

---

## Task 6: Doğrulama + merge + hafıza
- [ ] `cd web && npm run test && npm run build` → PASS/başarılı.
- [ ] Kullanıcıya `0014_task_points.sql` hatırlat.
- [ ] Elle: görev puanı düzenle; görev onayla → dashboard puanı + liderlik artar.
- [ ] main merge:
```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/gorev-puan -m "Merge feat/gorev-puan: onaylı görev puan entegrasyonu" && git push origin main
```
- [ ] Hafıza: "Görev puan entegrasyonu TAMAM (0014)" ekle; sıradaki → dosya yükleme (Storage).

## Spec Kapsam Kontrolü
- puan kolonu + leaderboard RPC (0014) → Task 2 ✓
- computePoints 3. arg → Task 1 ✓
- getDashboardData + buildStats → Task 3 ✓
- görev puan tip/select/action → Task 4 ✓
- puan UI (TaskForm + listeler) → Task 5 ✓
- testler (points, stats) → Task 1, 3 ✓
