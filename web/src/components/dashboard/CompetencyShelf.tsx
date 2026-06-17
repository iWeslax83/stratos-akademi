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
                {has ? t.ikon ?? "✓" : "–"}
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
