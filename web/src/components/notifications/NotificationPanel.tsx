"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listNotifications, markAllRead } from "@/app/actions/notifications";
import type { Notification } from "@/lib/notifications/queries";
import { NotificationItem } from "./NotificationItem";

// Masaüstünde zilin altında dropdown, mobilde alttan çıkan sheet.
export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [list, setList] = useState<Notification[] | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let iptal = false;
    listNotifications().then((n) => {
      if (!iptal) setList(n);
    });
    return () => {
      iptal = true;
    };
  }, []);

  // Escape ile kapan; mobil sheet açıkken arka plan kaymasın.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Mobil sheet (sm altı) açıkken arka plan kaymasın; masaüstü dropdown'da gerek yok.
    const onceki = document.body.style.overflow;
    if (window.innerWidth < 640) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = onceki;
    };
  }, [onClose]);

  const unread = (list ?? []).filter((n) => !n.okundu).length;

  return (
    <>
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-navy/40 sm:bg-transparent"
      />
      <div
        role="dialog"
        aria-label="Bildirimler"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-core border border-[var(--line)] bg-[var(--panel)] shadow-[0_-20px_50px_-20px_rgba(16,28,55,0.5)] sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 sm:max-h-[70vh] sm:w-[360px] sm:rounded-core sm:shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--line)] sm:hidden" />

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <span className="font-display text-sm font-bold text-navy dark:text-white">Bildirimler</span>
          {unread > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await markAllRead();
                  setList((l) => (l ?? []).map((n) => ({ ...n, okundu: true })));
                  router.refresh();
                })
              }
              className="shrink-0 text-xs font-semibold text-gold-ink hover:underline disabled:opacity-60 dark:text-gold"
            >
              {pending ? "…" : "Tümünü okundu işaretle"}
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {list === null ? (
            <div className="space-y-3 py-4" aria-label="Yükleniyor">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-[var(--line)]" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="py-6 text-sm text-muted">Bildirimin yok.</p>
          ) : (
            list.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                mesaj={n.mesaj}
                link={n.link}
                okundu={n.okundu}
                onDone={onClose}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--line)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            href="/bildirimler"
            onClick={onClose}
            className="text-xs font-semibold text-gold-ink hover:underline dark:text-gold"
          >
            Tüm bildirimler →
          </Link>
        </div>
      </div>
    </>
  );
}
