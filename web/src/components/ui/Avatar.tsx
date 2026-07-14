import Image from "next/image";
import { clsx } from "clsx";

const BOX = { sm: "h-9 w-9", lg: "h-16 w-16" } as const;
const PX = { sm: 36, lg: 64 } as const;
const TEXT = { sm: "text-sm", lg: "text-2xl" } as const;

/**
 * Üye avatarı: fotoğraf varsa fotoğraf, yoksa baş harf dairesi.
 * Fotoğraflar stratosiha.com içerik reposundan gelir (bkz. lib/team/photos.ts).
 */
export function Avatar({
  ad,
  src,
  size = "sm",
  className,
}: {
  ad: string;
  src?: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={ad}
        width={PX[size]}
        height={PX[size]}
        className={clsx(BOX[size], "shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={clsx(
        BOX[size],
        TEXT[size],
        "grid shrink-0 place-items-center rounded-full bg-navy font-bold text-white dark:bg-accent dark:text-navy",
        className,
      )}
    >
      {(ad || "E").charAt(0).toUpperCase()}
    </span>
  );
}
