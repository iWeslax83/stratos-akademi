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
