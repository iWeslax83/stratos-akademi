"use client";

import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationPanel } from "./NotificationPanel";

// Nav'daki zil: paneli açar/kapatır, okunmamış sayısını rozetle gösterir.
export function NotificationBell({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  const butonRef = useRef<HTMLButtonElement>(null);

  function kapat() {
    setOpen(false);
    butonRef.current?.focus();
  }

  return (
    <div className="relative">
      <IconButton
        ref={butonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </IconButton>

      {open && <NotificationPanel onClose={kapat} />}
    </div>
  );
}
