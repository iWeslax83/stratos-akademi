import { clsx } from "clsx";

export function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold",
        accent
          ? "border-accent-ink/25 bg-accent-soft text-accent-ink dark:border-accent/25 dark:bg-accent-dark dark:text-accent"
          : "border-[var(--line)] bg-black/5 text-navy dark:bg-white/[0.06] dark:text-[#dbe4f3]",
      )}
    >
      {children}
    </span>
  );
}
