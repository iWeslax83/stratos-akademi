export function StatRing({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <div className="font-display text-3xl font-extrabold leading-none text-navy dark:text-white">
        %{pct}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
