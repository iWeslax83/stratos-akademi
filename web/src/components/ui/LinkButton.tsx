import Link from "next/link";
import { buttonClasses, type ButtonVariant } from "./Button";

// Görsel olarak Button, semantik olarak bağlantı. `<Link><Button/></Link>` (a>button
// iç içe — geçersiz) yerine kullanılır.
export function LinkButton({
  href,
  children,
  variant = "primary",
  icon,
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={buttonClasses(variant, icon != null, className)} {...rest}>
      <span>{children}</span>
      {icon != null && (
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20">
          {icon}
        </span>
      )}
    </Link>
  );
}
