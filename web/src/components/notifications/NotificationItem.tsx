"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRead } from "@/app/actions/notifications";
import { resolveClick } from "@/lib/notifications/click";

// Tek bildirim: tıklayınca okundu işaretlenir ve (varsa) linke gider.
export function NotificationItem({
  id,
  mesaj,
  link,
  okundu,
}: {
  id: string;
  mesaj: string;
  link: string | null;
  okundu: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function open() {
    const plan = resolveClick(okundu, link);
    if (!plan.mark) {
      if (plan.navigateTo) router.push(plan.navigateTo);
      return;
    }
    start(async () => {
      await markRead(id);
      if (plan.navigateTo) router.push(plan.navigateTo);
      else if (plan.refresh) router.refresh();
    });
  }

  const tiklanabilir = !okundu || !!link;

  return (
    <div
      onClick={tiklanabilir ? open : undefined}
      role={tiklanabilir ? "button" : undefined}
      tabIndex={tiklanabilir ? 0 : undefined}
      onKeyDown={
        tiklanabilir
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
      aria-disabled={pending}
      className={`flex items-start gap-3 border-b border-[var(--line)] py-3 last:border-b-0 ${
        tiklanabilir ? "cursor-pointer" : ""
      } ${!okundu ? "font-semibold" : ""} ${pending ? "opacity-60" : ""}`}
    >
      {!okundu && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
      <span className={`flex-1 text-sm ${okundu ? "text-muted" : "text-navy dark:text-white"}`}>
        {mesaj}
      </span>
      {link && <span className="shrink-0 text-xs font-semibold text-gold">→</span>}
    </div>
  );
}
