"use client";

import { useEffect, useRef } from "react";

type Opts = {
  // Tab dolaşımını panel içinde tut (modal/sheet için).
  trap?: boolean;
  // Arka plan kaymasını engelle: true her yerde, "mobile" yalnız < 640px.
  lockScroll?: boolean | "mobile";
};

// Açılır panel / menü klavye + odak davranışı: mount'ta odağı içeri al, Escape ile
// kapat, unmount'ta odağı tetikleyen öğeye geri ver, istenirse Tab'ı içeride hapset.
// Panel yalnız açıkken render edildiği için "open" parametresi yok.
export function useDismissable<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  { trap = false, lockScroll = false }: Opts = {},
) {
  const panelRef = useRef<T>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    // Odağı panele taşı (ilk odaklanabilir öğe, yoksa panelin kendisi).
    const first = focusable()[0];
    if (first) first.focus();
    else if (panel) {
      panel.setAttribute("tabindex", "-1");
      panel.focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && trap) {
        const items = focusable();
        if (items.length === 0) return;
        const lo = items[0];
        const hi = items[items.length - 1];
        if (e.shiftKey && document.activeElement === lo) {
          e.preventDefault();
          hi.focus();
        } else if (!e.shiftKey && document.activeElement === hi) {
          e.preventDefault();
          lo.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey, true);

    const doLock =
      lockScroll === true || (lockScroll === "mobile" && window.innerWidth < 640);
    const prevOverflow = document.body.style.overflow;
    if (doLock) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (doLock) document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [onClose, trap, lockScroll]);

  return panelRef;
}
