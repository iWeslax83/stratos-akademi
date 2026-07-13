import { clsx } from "clsx";
import { CountUp } from "@/components/ui/CountUp";

export function StatCard({
  icon,
  value,
  countTo,
  label,
  accent = false,
}: {
  icon?: React.ReactNode;
  value?: React.ReactNode;
  // Verilirse sayı 0'dan bu değere animasyonla sayar (value yerine).
  countTo?: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      {icon != null && <div className="mb-2 text-lg">{icon}</div>}
      <div
        className={clsx(
          "font-display text-3xl font-extrabold leading-none",
          accent ? "text-accent-ink dark:text-accent" : "text-navy dark:text-white",
        )}
      >
        {countTo != null ? <CountUp value={countTo} /> : value}
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
