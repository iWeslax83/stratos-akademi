import { clsx } from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-bezel border border-[var(--line)] bg-black/[0.04] p-[7px] dark:bg-white/[0.03]">
      <div
        className={clsx(
          "rounded-core bg-[var(--panel)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
