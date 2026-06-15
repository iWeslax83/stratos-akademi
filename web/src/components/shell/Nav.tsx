import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Nav({ initial = "E" }: { initial?: string }) {
  return (
    <nav className="flex items-center gap-4 rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[rgba(20,32,56,0.6)]">
      <Link href="/panom" className="flex items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white">
        <span className="text-gold">◆</span> STRATOS
        <span className="text-sm font-semibold text-muted">akademi</span>
      </Link>
      <div className="ml-auto flex items-center gap-2.5">
        <Chip>🔥 0 gün</Chip>
        <Chip gold>⭐ 0 puan</Chip>
        <ThemeToggle />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-gold dark:text-navy">
          {initial}
        </span>
      </div>
    </nav>
  );
}
