"use client";

// Sertifikayı yazdır / PDF olarak kaydet. Yazdırırken gizlenir (print:hidden).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] print:hidden dark:bg-accent dark:text-navy"
    >
      Yazdır / PDF olarak kaydet
    </button>
  );
}
