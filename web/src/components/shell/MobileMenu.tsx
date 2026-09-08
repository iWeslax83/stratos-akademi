"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { MEMBER_LINKS, ADMIN_LINKS } from "@/lib/nav/links";
import { IconButton } from "@/components/ui/IconButton";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import { useDismissable } from "@/lib/ui/useDismissable";

const LINKS = [...MEMBER_LINKS, { href: "/profil", label: "Profil" }];

function MenuBody({ isAdmin, onClose }: { isAdmin: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const panelRef = useDismissable<HTMLDivElement>(onClose, { trap: true });

  const linkCls = (href: string, admin = false) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return clsx(
      "block rounded-lg px-3 py-2 text-sm font-semibold",
      admin ? "text-accent-ink dark:text-accent" : "text-navy dark:text-white",
      active
        ? "bg-accent-soft dark:bg-accent-dark"
        : "hover:bg-black/5 dark:hover:bg-white/10",
    );
  };
  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />
      <div
        ref={panelRef}
        role="menu"
        aria-label="Menü"
        className="absolute right-0 z-50 mt-2 w-48 rounded-core border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)]"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            role="menuitem"
            aria-current={current(l.href)}
            onClick={onClose}
            className={linkCls(l.href)}
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <div className="my-1 border-t border-[var(--line)]" />
            {ADMIN_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                aria-current={current(l.href)}
                onClick={onClose}
                className={linkCls(l.href, true)}
              >
                {l.label}
              </Link>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export function MobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <IconButton
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Menüyü kapat" : "Menü"}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {open ? <XIcon size={18} /> : <MenuIcon size={18} />}
      </IconButton>

      {open && <MenuBody isAdmin={isAdmin} onClose={() => setOpen(false)} />}
    </div>
  );
}
