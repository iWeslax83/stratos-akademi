import { clsx } from "clsx";

export function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold",
        accent
          ? "border-accent-ink/25 bg-accent-wash text-accent-fg dark:border-accent/25"
          : "border-[var(--line)] bg-tint text-fg",
      )}
    >
      {children}
    </span>
  );
}
