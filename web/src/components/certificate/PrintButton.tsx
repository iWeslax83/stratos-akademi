"use client";

// Sertifikayı yazdır / PDF olarak kaydet. Yazdırırken gizlenir (print:hidden).
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white print:hidden dark:bg-accent dark:text-navy"
    >
      Yazdır / PDF olarak kaydet
    </button>
  );
}
