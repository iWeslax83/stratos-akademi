import { clsx } from "clsx";

export function Card({
  children,
  className,
  outerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  // Dış "bezel" sarmalayıcıya uygulanır. Grid öğesi BU div olduğu için
  // col-span / h-full gibi yerleşim sınıfları buraya gelmeli (className iç panele gider).
  outerClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-bezel border border-[var(--line)] bg-black/[0.04] p-[7px] dark:bg-white/[0.03]",
        outerClassName,
      )}
    >
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
