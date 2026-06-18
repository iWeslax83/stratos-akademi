import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { unreadCount } from "@/lib/notifications/queries";

export async function Nav({
  initial = "E",
  streak,
  points,
  isAdmin = false,
}: {
  initial?: string;
  streak?: number;
  points?: number;
  isAdmin?: boolean;
}) {
  const supabase = await createClient();
  const unread = await unreadCount(supabase);
  return (
    <nav className="flex items-center gap-4 rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[rgba(20,32,56,0.6)]">
      <Link
        href="/panom"
        className="flex items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white"
      >
        <span className="text-gold">◆</span> STRATOS
        <span className="text-sm font-semibold text-muted">akademi</span>
      </Link>
      <div className="ml-2 hidden items-center gap-1 sm:flex">
        <Link href="/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Müfredat
        </Link>
        <Link href="/panom" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Panom
        </Link>
        <Link href="/liderlik" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white">
          Liderlik
        </Link>
        {isAdmin && (
          <>
            <Link href="/admin/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Yönetim
            </Link>
            <Link href="/admin/uyeler" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Üyeler
            </Link>
            <Link href="/admin/onaylar" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Onaylar
            </Link>
          </>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        {streak != null && <Chip>Seri · {streak} gün</Chip>}
        {points != null && <Chip gold>{points} puan</Chip>}
        <Link
          href="/bildirimler"
          className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white"
        >
          Bildirimler
          {unread > 0 && (
            <span className="ml-1 inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy">
              {unread}
            </span>
          )}
        </Link>
        <ThemeToggle />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-gold dark:text-navy">
          {initial}
        </span>
      </div>
    </nav>
  );
}
