"use client";

import { buttonClasses } from "@/components/ui/Button";

// Sertifikayı yazdır / PDF olarak kaydet. Yazdırırken gizlenir (print:hidden).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClasses("primary", false, "print:hidden dark:bg-accent dark:text-navy")}
    >
      Yazdır / PDF olarak kaydet
    </button>
  );
}
