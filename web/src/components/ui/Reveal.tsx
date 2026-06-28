"use client";

import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import { clsx } from "clsx";

// İçeriği görünür olunca yumuşakça fade-up ile getirir (IntersectionObserver).
// prefers-reduced-motion'da CSS animasyonu kapanır (globals.css) → anında görünür.
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms — sıralı (stagger) giriş için
  as?: "div" | "section" | "li";
}) {
  const Tag = as as ElementType;
  const elRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const setRef = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={setRef}
      className={clsx("reveal", visible && "is-visible", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
