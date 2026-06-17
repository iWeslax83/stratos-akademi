import { clsx } from "clsx";

export function StatCard({
  icon,
  value,
  label,
  gold = false,
}: {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      {icon != null && <div className="mb-2 text-lg">{icon}</div>}
      <div
        className={clsx(
          "font-display text-3xl font-extrabold leading-none",
          gold ? "text-gold" : "text-navy dark:text-white",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
