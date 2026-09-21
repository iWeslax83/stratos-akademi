"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

// Nav'daki ikon düğmeleri (tema, zil, menü) için ortak taban. Görsel boyut 36px kalır
// ama ::after ile dokunma hedefi ~46px'e genişler (WIG: min 44×44).
type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "relative grid h-9 w-9 place-items-center rounded-full bg-tint text-fg transition-colors",
        "hover:bg-tint-hover disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "after:absolute after:-inset-[5px] after:content-['']",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
