import { clsx } from "clsx";

export function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        accent
          ? "bg-accent-soft text-accent-ink dark:bg-accent-dark dark:text-accent"
          : "bg-black/5 text-navy dark:bg-white/[0.06] dark:text-[#dbe4f3]",
      )}
    >
      {children}
    </span>
  );
}
