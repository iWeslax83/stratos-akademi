import { clsx } from "clsx";

export function Card({
  children,
  className,
  outerClassName,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  // Dış "bezel" sarmalayıcıya uygulanır. Grid öğesi BU div olduğu için
  // col-span / h-full gibi yerleşim sınıfları buraya gelmeli (className iç panele gider).
  outerClassName?: string;
  // Tıklanabilir kartlar için: hover'da hafif yükselme + gölge derinleşmesi.
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "group rounded-bezel border border-[var(--line)] bg-black/[0.04] p-[7px] shadow-soft dark:bg-white/[0.03]",
        interactive &&
          "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover",
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
