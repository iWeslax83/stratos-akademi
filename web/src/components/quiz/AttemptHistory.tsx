import { sortAttemptsDesc, summarizeAttempts, type AttemptRow } from "@/lib/quiz/history";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// Üyenin bu quizdeki geçmiş denemeleri: özet + deneme listesi. Salt okunur (server component).
export function AttemptHistory({ attempts }: { attempts: AttemptRow[] }) {
  const summary = summarizeAttempts(attempts);
  if (!summary) return null;

  const sorted = sortAttemptsDesc(attempts);

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-bold text-fg">
        Deneme Geçmişi
      </h2>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Deneme" value={String(summary.deneme)} />
        <Stat label="En iyi" value={`${summary.enIyi}`} />
        <Stat
          label="Son"
          value={`${summary.sonPuan}`}
          hint={summary.trend !== 0 ? (summary.trend > 0 ? `+${summary.trend}` : `${summary.trend}`) : undefined}
          hintUp={summary.trend > 0}
        />
      </div>

      <ul className="space-y-2">
        {sorted.map((a, i) => (
          <li
            key={`${a.created_at}-${i}`}
            className="flex items-center justify-between rounded-core border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-sm"
          >
            <span className="text-fg-soft">{formatDate(a.created_at)}</span>
            <span className="flex items-center gap-3">
              <span className="font-display font-bold text-fg">{a.puan}</span>
              <span
                className={
                  a.gecti
                    ? "inline-flex items-center gap-1 text-xs font-bold text-accent-fg"
                    : "inline-flex items-center gap-1 text-xs font-bold text-fg-soft"
                }
              >
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${a.gecti ? "bg-accent-fg" : "bg-muted"}`} />
                {a.gecti ? "Geçti" : "Kaldı"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  hintUp,
}: {
  label: string;
  value: string;
  hint?: string;
  hintUp?: boolean;
}) {
  return (
    <div className="rounded-core border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-xl font-bold text-fg">{value}</span>
        {hint && (
          <span
            className={
              hintUp ? "text-xs font-semibold text-accent-fg" : "text-xs font-semibold text-danger-fg"
            }
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
