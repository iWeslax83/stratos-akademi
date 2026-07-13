"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ActionButton({
  onAction,
  children,
  variant = "ghost",
}: {
  onAction: () => Promise<{ ok: boolean; error?: string }>;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "accent";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function click() {
    start(async () => {
      const r = await onAction();
      if (!r.ok) window.alert(r.error ?? "İşlem başarısız");
      else router.refresh();
    });
  }

  return (
    <Button variant={variant} type="button" onClick={click} disabled={pending}>
      {pending ? "…" : children}
    </Button>
  );
}
