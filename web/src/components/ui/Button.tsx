import { clsx } from "clsx";

export type ButtonVariant = "primary" | "ghost" | "accent";

const BASE =
  "inline-flex items-center gap-2.5 font-display font-semibold text-sm rounded-full transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white shadow-soft hover:shadow-soft-hover",
  accent: "bg-accent text-navy shadow-soft hover:shadow-soft-hover",
  ghost: "bg-black/[0.06] text-navy dark:bg-white/10 dark:text-white",
};

export function buttonClasses(variant: ButtonVariant, hasIcon: boolean, className?: string): string {
  return clsx(BASE, hasIcon ? "pl-5 pr-3 py-3" : "px-5 py-3", VARIANTS[variant], className);
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
};

// type varsayılanı "button" — bir form içindeyken kazara submit tetiklemesin.
// Gerçek submit düğmesi type="submit" geçmeli.
export function Button({
  children,
  variant = "primary",
  icon,
  loading = false,
  className,
  disabled,
  type = "button",
  ...rest
}: Props) {
  const showIcon = loading || icon != null;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, showIcon, className)}
      {...rest}
    >
      <span>{children}</span>
      {showIcon && (
        <span
          data-testid="btn-icon"
          className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20"
        >
          {loading ? <Spinner /> : icon}
        </span>
      )}
    </button>
  );
}
