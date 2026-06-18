"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markAllRead } from "@/app/actions/notifications";

export function MarkReadButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await markAllRead(); router.refresh(); })}
    >
      {pending ? "…" : "Tümünü okundu işaretle"}
    </Button>
  );
}
