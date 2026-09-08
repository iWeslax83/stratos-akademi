"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";

// Form hata mesajı: role="alert" (ekran okuyucu duyurur) + görünür olunca kendine
// kaydırır. `box` → dolgulu kutu (form üstü), aksi halde ince satır.
export function FormError({
  children,
  box = false,
  className,
}: {
  children?: string | null;
  box?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (children) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [children]);

  if (!children) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={clsx(
        "text-sm font-semibold text-red-700 dark:text-red-300",
        box && "rounded-core bg-red-50 p-3 dark:bg-red-900/30",
        className,
      )}
    >
      {children}
    </div>
  );
}
