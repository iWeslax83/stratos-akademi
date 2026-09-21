import Link from "next/link";
import type { TrackProgress } from "@/lib/curriculum/types";
import { TrackIcon } from "@/components/ui/TrackIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function TrackList({ tracks }: { tracks: TrackProgress[] }) {
  return (
    <div className="p-6">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-fg">Öğrenme dalların</h2>
        <Link href="/mufredat" className="text-2sm font-semibold text-muted">
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
            <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-accent-wash text-accent-fg">
              <TrackIcon slug={t.slug} ikon={t.ikon} size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-fg">{t.ad}</div>
              <div className="text-xs text-muted">{t.moduleCount} modül</div>
            </div>
            <ProgressBar pct={t.pct} label={`${t.ad} ilerleme`} heightClass="h-[7px]" className="ml-auto w-full max-w-[160px] flex-1" />
            <div className="w-9 shrink-0 text-right font-display text-2sm font-bold tabular-nums text-fg">
              %{t.pct}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
