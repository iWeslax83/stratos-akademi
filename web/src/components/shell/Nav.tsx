import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { AdminMenu } from "./AdminMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/server";
import { unreadCount } from "@/lib/notifications/queries";
import { MEMBER_LINKS } from "@/lib/nav/links";
import { LogoMark } from "@/components/brand/LogoMark";
import { Avatar } from "@/components/ui/Avatar";
import { getTeamPhotos, photoFor } from "@/lib/team/photos";

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
  // Avatarı Nav kendi çözer: her sayfaya avatar prop'u geçirmek yerine
  // kullanıcının adını burada okuyup site fotoğraflarıyla eşleştiriyoruz.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: me }, photos] = await Promise.all([
    supabase.from("profiles").select("ad").eq("id", user!.id).single(),
    getTeamPhotos(),
  ]);
  const foto = photoFor(photos, me?.ad);
  return (
    <nav className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)] sm:gap-3 sm:px-4">
      <Link
        href="/panom"
        className="flex shrink-0 items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white"
      >
        {/* Dar telefonlarda amblem küçülür; h-* sınıfı svg'nin size attr'ını ezer. */}
        <LogoMark size={32} className="h-6 w-auto text-navy dark:text-white sm:h-8" /> STRATOS
        {/* Alt başlık yalnızca menü linkleri + çiplerle birlikte sığdığı genişlikte. */}
        <span className="hidden text-sm font-semibold text-muted min-[520px]:max-lg:inline xl:inline">
          akademi
        </span>
      </Link>
      <div className="ml-1 hidden shrink-0 items-center gap-0.5 lg:flex">
        {MEMBER_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-muted hover:text-navy dark:hover:text-white"
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && <AdminMenu />}
      </div>
      {/* Sağ küme hiçbir genişlikte sıkışmaz; daralınca menü linkleri kısalır. */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <div className="hidden items-center gap-2.5 xl:flex">
          {streak != null && <Chip>Seri · {streak} gün</Chip>}
          {points != null && <Chip accent>{points} puan</Chip>}
        </div>
        <NotificationBell unread={unread} />
        <ThemeToggle />
        <Link href="/profil" title="Profil" className="shrink-0">
          <Avatar ad={me?.ad ?? initial} src={foto} />
        </Link>
        <MobileMenu isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
