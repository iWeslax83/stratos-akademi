"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

// Bulunduğun sayfanın linki vurgulanır (aria-current ile ekran okuyuculara da bildirilir).
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "whitespace-nowrap rounded-full px-2.5 py-1.5 text-2sm font-semibold transition-colors",
        active
          ? "bg-accent-wash text-accent-fg"
          : "text-muted hover:text-fg",
      )}
    >
      {label}
    </Link>
  );
}
