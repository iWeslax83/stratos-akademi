import { clsx } from "clsx";

export function Chip({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        gold
          ? "bg-gold-soft text-[#6f560a] dark:bg-gold-dark dark:text-[#ffd54a]"
          : "bg-black/5 text-navy dark:bg-white/[0.06] dark:text-[#dbe4f3]",
      )}
    >
      {children}
    </span>
  );
}
