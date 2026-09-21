import { clsx } from "clsx";

// İlerleme çubuğu: ekran okuyucuya değer ve etiketi verir (role="progressbar").
// Renk tek başına anlam taşımaz; yüzde metni çubuğun yanında ayrıca yazılır.
export function ProgressBar({
  pct,
  label,
  className,
  heightClass = "h-2",
}: {
  pct: number;
  label: string;
  className?: string;
  heightClass?: string;
}) {
  const v = Math.round(Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0)));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={clsx("overflow-hidden rounded-full bg-track", heightClass, className)}
    >
      <div data-fill className="h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
    </div>
  );
}
