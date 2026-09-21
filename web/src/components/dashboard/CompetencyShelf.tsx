import { clsx } from "clsx";
import { TrackIcon } from "@/components/ui/TrackIcon";

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
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {tracks.map((t) => {
            const has = earnedSet.has(t.slug);
            return (
              <li
                key={t.slug}
                className={clsx(
                  "grid h-10 w-10 place-items-center rounded-xl border text-accent-fg",
                  has
                    ? "border-accent/40 bg-accent-wash dark:border-accent-dark"
                    : "border-[var(--line)] bg-black/[0.04] opacity-50 grayscale dark:bg-white/[0.04]",
                )}
              >
                <TrackIcon slug={t.slug} ikon={t.ikon} size={20} />
                <span className="sr-only">
                  {t.ad}: {has ? "kazanıldı" : "kazanılmadı"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {rank != null && (
        <div className="flex flex-col items-end">
          <div className="font-display text-3xl font-extrabold text-fg">#{rank}</div>
          <div className="text-xs font-semibold text-muted">Sıralaman</div>
        </div>
      )}
    </div>
  );
}
