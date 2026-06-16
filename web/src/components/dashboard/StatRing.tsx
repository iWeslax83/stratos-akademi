export function StatRing({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-5 text-center">
      <div
        className="mb-2 grid h-16 w-16 place-items-center rounded-full"
        style={{ background: `conic-gradient(#c9a23a ${pct}%, rgba(100,112,138,0.25) 0)` }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--panel)] font-display text-sm font-extrabold text-navy dark:text-white">
          %{pct}
        </span>
      </div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
