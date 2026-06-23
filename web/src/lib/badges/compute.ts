import { BADGES, type Badge, type BadgeStats } from "./catalog";

export type BadgeScope = "full" | "public";

function inScope(badge: Badge, scope: BadgeScope): boolean {
  return scope === "full" || badge.public;
}

/** Eşiği karşılanan rozetlerin id kümesi. */
export function computeBadges(stats: BadgeStats): Set<string> {
  const earned = new Set<string>();
  for (const b of BADGES) {
    if (stats[b.dep] >= b.esik) earned.add(b.id);
  }
  return earned;
}

export type BadgeRow = { badge: Badge; earned: boolean; current: number };

/** scope'a göre süzülmüş tüm rozetler + kazanım durumu + güncel değer. */
export function badgeProgress(stats: BadgeStats, scope: BadgeScope = "full"): BadgeRow[] {
  return BADGES.filter((b) => inScope(b, scope)).map((b) => ({
    badge: b,
    earned: stats[b.dep] >= b.esik,
    current: stats[b.dep],
  }));
}

export type NextBadge = { badge: Badge; current: number; kalan: number };

/**
 * Tamamlanmaya en yakın kilitli rozet (scope içinde). Yakınlık ORANSAL ölçülür
 * (current/esik) — çünkü "kalan" ham sayı farklı birimleri (ders/görev/puan)
 * kıyaslanamaz kılar. Eşitlikte daha küçük eşik öne geçer (ilk kilometre taşı).
 * Hepsi kazanıldıysa null.
 */
export function nextBadge(stats: BadgeStats, scope: BadgeScope = "full"): NextBadge | null {
  let best: NextBadge | null = null;
  let bestRatio = -1;
  for (const b of BADGES) {
    if (!inScope(b, scope)) continue;
    const current = stats[b.dep];
    if (current >= b.esik) continue; // kazanıldı
    const ratio = current / b.esik;
    const better =
      best === null ||
      ratio > bestRatio ||
      (ratio === bestRatio && b.esik < best.badge.esik);
    if (better) {
      best = { badge: b, current, kalan: b.esik - current };
      bestRatio = ratio;
    }
  }
  return best;
}
