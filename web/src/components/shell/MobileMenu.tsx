"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/mufredat", label: "Müfredat" },
  { href: "/panom", label: "Panom" },
  { href: "/liderlik", label: "Liderlik" },
  { href: "/duyurular", label: "Duyurular" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/profil", label: "Profil" },
];

const ADMIN_LINKS = [
  { href: "/admin/mufredat", label: "Yönetim" },
  { href: "/admin/uyeler", label: "Üyeler" },
  { href: "/admin/onaylar", label: "Onaylar" },
  { href: "/admin/duyurular", label: "Duyurular" },
  { href: "/admin/etkinlikler", label: "Etkinlikler" },
  { href: "/admin/analitik", label: "Analitik" },
];

export function MobileMenu({ isAdmin, unread }: { isAdmin: boolean; unread: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menü"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-black/5 text-navy dark:bg-white/10 dark:text-white"
      >
        <span className="text-lg leading-none">≡</span>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-core border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)]">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/bildirimler"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
            >
              Bildirimler
              {unread > 0 && (
                <span className="ml-2 inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy">
                  {unread}
                </span>
              )}
            </Link>
            {isAdmin && (
              <>
                <div className="my-1 border-t border-[var(--line)]" />
                {ADMIN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-gold hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {l.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
