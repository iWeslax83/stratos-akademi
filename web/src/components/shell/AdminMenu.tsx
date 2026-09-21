"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ADMIN_LINKS } from "@/lib/nav/links";
import { useDismissable } from "@/lib/ui/useDismissable";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("transition-transform", open && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const panelRef = useDismissable<HTMLDivElement>(onClose, { trap: true });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" />
      <div
        ref={panelRef}
        role="menu"
        aria-label="Yönetim"
        className="absolute right-0 z-50 mt-2 w-44 rounded-core border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)]"
      >
        {ADMIN_LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              aria-current={active ? "page" : undefined}
              onClick={onClose}
              className={clsx(
                "block rounded-lg px-3 py-2 text-sm font-semibold text-accent-fg",
                active ? "bg-accent-wash" : "hover:bg-black/5 dark:hover:bg-white/10",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

// Masaüstü nav'da admin linklerini tek "Yönetim" açılır menüsünde toplar.
export function AdminMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-2sm font-semibold text-accent-fg hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Yönetim <Chevron open={open} />
      </button>

      {open && <Panel onClose={() => setOpen(false)} />}
    </div>
  );
}
