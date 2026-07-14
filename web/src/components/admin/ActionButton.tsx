"use client";

import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function ActionButton({
  onAction,
  children,
  variant = "ghost",
}: {
  onAction: () => Promise<{ ok: boolean; error?: string }>;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "accent";
}) {
  const { pending, error, run } = useServerAction();

  return (
    <span>
      <Button variant={variant} type="button" onClick={() => run(onAction)} disabled={pending}>
        {pending ? "…" : children}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
