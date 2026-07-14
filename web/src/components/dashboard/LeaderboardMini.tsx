import Link from "next/link";
import { clsx } from "clsx";
import type { LeaderRow } from "@/lib/dashboard/leaderboard";

function Row({ row, me }: { row: LeaderRow; me: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0",
        me && "-mx-2.5 rounded-xl border-b-0 bg-accent-soft px-2.5 dark:bg-accent-dark",
      )}
    >
      <span
        className={clsx(
          "w-6 text-center font-display text-sm font-extrabold tabular-nums",
          row.sira <= 3 ? "text-accent-ink dark:text-accent" : "text-muted",
        )}
      >
        {row.sira}
      </span>
      <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-navy text-xs font-bold text-white dark:bg-accent dark:text-navy">
        {row.gorunenAd.charAt(0)}
      </span>
      <Link href={`/uye/${row.userId}`} className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-navy hover:text-accent-ink dark:hover:text-accent dark:text-white">
        {row.gorunenAd}
      </Link>
      <span className="shrink-0 font-display text-[13px] font-bold tabular-nums text-accent-ink dark:text-accent">
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
          {rows.slice(0, 3).map((r) => (
            <Row key={r.userId} row={r} me={r.userId === meUserId} />
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
