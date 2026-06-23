import { clsx } from "clsx";
import type { BadgeDep } from "@/lib/badges/catalog";
import type { BadgeRow, NextBadge } from "@/lib/badges/compute";

const DEP_BIRIM: Record<BadgeDep, string> = {
  lessons: "ders",
  tasks: "görev",
  competencies: "dal",
  points: "puan",
  streak: "gün",
  quizPerfect: "tam quiz",
};

export function BadgeShelf({
  items,
  next,
  baslik = "Rozetler",
}: {
  items: BadgeRow[];
  next?: NextBadge | null;
  baslik?: string;
}) {
  const earnedCount = items.filter((r) => r.earned).length;
  return (
    <div className="p-5">
      <div className="text-xs font-semibold text-muted">
        {baslik} · {earnedCount} / {items.length}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {items.map(({ badge, earned }) => (
          <div
            key={badge.id}
            title={badge.aciklama}
            className="flex w-[68px] flex-col items-center gap-1.5 text-center"
          >
            <span
              className={clsx(
                "grid h-12 w-12 place-items-center rounded-xl border text-xl",
                earned
                  ? "border-[#efdfa8] bg-gold-soft dark:border-gold-dark dark:bg-gold-dark"
                  : "border-[var(--line)] bg-black/[0.04] opacity-50 grayscale dark:bg-white/[0.04]",
              )}
            >
              {badge.ikon}
            </span>
            <span
              className={clsx(
                "text-[11px] leading-tight",
                earned ? "font-semibold text-navy dark:text-white" : "text-muted",
              )}
            >
              {badge.ad}
            </span>
          </div>
        ))}
      </div>
      {next && (
        <p className="mt-4 text-xs text-muted">
          Sıradaki: <span className="font-semibold text-navy dark:text-white">{next.badge.ad}</span> —{" "}
          {next.kalan} {DEP_BIRIM[next.badge.dep]} kaldı
        </p>
      )}
    </div>
  );
}
