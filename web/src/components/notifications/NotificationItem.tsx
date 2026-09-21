"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRead } from "@/app/actions/notifications";
import { resolveClick } from "@/lib/notifications/click";
import { ArrowRightIcon } from "@/components/ui/icons";

// Tek bildirim: tıklayınca okundu işaretlenir ve (varsa) linke gider.
export function NotificationItem({
  id,
  mesaj,
  link,
  okundu,
  onDone,
}: {
  id: string;
  mesaj: string;
  link: string | null;
  okundu: boolean;
  // Panel içinde kullanılırken: tıklama işlendikten sonra paneli kapatmak için.
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function open() {
    const plan = resolveClick(okundu, link);
    if (!plan.mark) {
      if (plan.navigateTo) router.push(plan.navigateTo);
      onDone?.();
      return;
    }
    start(async () => {
      await markRead(id);
      if (plan.navigateTo) router.push(plan.navigateTo);
      else if (plan.refresh) router.refresh();
      onDone?.();
    });
  }

  const tiklanabilir = !okundu || !!link;
  const inner = (
    <>
      {!okundu && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />}
      <span className={`min-w-0 flex-1 break-words text-sm ${okundu ? "text-muted" : "text-fg"}`}>
        {mesaj}
      </span>
      {link && <ArrowRightIcon size={14} className="mt-0.5 shrink-0 text-accent-fg" />}
    </>
  );

  const cls = `flex min-h-[44px] w-full items-start gap-3 border-b border-[var(--line)] py-3 text-left last:border-b-0 ${
    !okundu ? "font-semibold" : ""
  } ${pending ? "opacity-60" : ""}`;

  if (!tiklanabilir) {
    return <div className={cls}>{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className={`${cls} cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default`}
    >
      {inner}
    </button>
  );
}
