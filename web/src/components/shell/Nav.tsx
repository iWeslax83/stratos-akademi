import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { AdminMenu } from "./AdminMenu";
import { createClient } from "@/lib/supabase/server";
import { unreadCount } from "@/lib/notifications/queries";
import { MEMBER_LINKS } from "@/lib/nav/links";

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
    <nav className="flex items-center gap-4 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)]">
      <Link
        href="/panom"
        className="flex items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white"
      >
        <span className="text-gold">◆</span> STRATOS
        <span className="text-sm font-semibold text-muted">akademi</span>
      </Link>
      <div className="ml-2 hidden items-center gap-1 sm:flex">
        {MEMBER_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white"
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && <AdminMenu />}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2.5 sm:flex">
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
        </div>
        <ThemeToggle />
        <Link
          href="/profil"
          title="Profil"
          className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-gold dark:text-navy"
        >
          {initial}
        </Link>
        <MobileMenu isAdmin={isAdmin} unread={unread} />
      </div>
    </nav>
  );
}
