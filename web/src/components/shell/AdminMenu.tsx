"use client";

import { useState } from "react";
import Link from "next/link";
import { ADMIN_LINKS } from "@/lib/nav/links";

// Masaüstü nav'da admin linklerini tek "Yönetim ▾" açılır menüsünde toplar.
export function AdminMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80"
      >
        Yönetim <span className="text-[10px]">▾</span>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-core border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)]">
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
          </div>
        </>
      )}
    </div>
  );
}
