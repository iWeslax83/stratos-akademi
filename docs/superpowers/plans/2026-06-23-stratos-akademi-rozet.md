# Stratos Akademi — Rozetler Uygulama Planı

**Spec:** `docs/superpowers/specs/2026-06-23-stratos-akademi-rozet-design.md`
**Dal:** `feat/rozet` → main merge. **Migration yok** (türetilmiş).

## Görev 1 — Katalog + saf hesap (TDD)
- `web/src/lib/badges/catalog.ts`: `Badge`, `BadgeDep`, `BadgeStats` tipleri + `BADGES` (15 rozet).
- `web/src/lib/badges/compute.ts`: `computeBadges`, `badgeProgress(stats, scope)`, `nextBadge(stats, scope)`.
- `web/src/test/badges/compute.test.ts`: boş stat → 0 rozet; eşik sınırları (1/5/15/30 ders vb.);
  public/full scope süzme; nextBadge en küçük kalan; quizPerfect sayımı çağıranda.
- Doğrula: `npx vitest run src/test/badges` FAIL → impl → PASS. Commit.

## Görev 2 — BadgeShelf bileşeni (TDD)
- `web/src/components/dashboard/BadgeShelf.tsx`: props `{ items: {badge,earned,current}[], baslik? }`;
  kazanılan altın (CompetencyShelf earned stili), kilitli grayscale+opacity-50; `aciklama` title;
  "Rozetler · X / Y". Opsiyonel `next` ipucu satırı.
- `web/src/test/dashboard/BadgeShelf.test.tsx`: kazanılan/kilitli sayımı, başlık, erişilebilir etiket.
- Doğrula: vitest FAIL → impl → PASS. Commit.

## Görev 3 — Sayfalara bağla
- `/profil`: tam katalog; `quizPerfect = bestQuizScores.filter(s=>s>=100).length`; onaylı görev sayısı zaten var.
- `/panom`: yalnız kazanılan kompakt şerit (boşsa gizle).
- `/uye/[id]`: public scope (10 rozet); `member` alanlarından BadgeStats (streak/quizPerfect = 0, gösterilmez).
- Doğrula: `npm run build` + `npx tsc --noEmit` + `npm run test` (tüm suite) PASS. Commit.

## Görev 4 — Kapanış
- README "Özellikler"e Rozetler satırı; memory güncelle.
- main merge (`--no-ff`, "Merge feat/rozet: rozetler (achievements)").
