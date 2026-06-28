import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "gold";
  icon?: React.ReactNode;
};

export function Button({ children, variant = "primary", icon, className, ...rest }: Props) {
  const base =
    "inline-flex items-center gap-2.5 font-display font-semibold text-sm rounded-full transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer";
  const pad = icon ? "pl-5 pr-3 py-3" : "px-5 py-3";
  const variants = {
    primary: "bg-navy text-white shadow-soft hover:shadow-soft-hover",
    gold: "bg-gold text-navy shadow-soft hover:shadow-soft-hover",
    ghost: "bg-black/[0.06] text-navy dark:bg-white/10 dark:text-white",
  } as const;

  return (
    <button className={clsx(base, pad, variants[variant], className)} {...rest}>
      <span>{children}</span>
      {icon != null && (
        <span
          data-testid="btn-icon"
          className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20"
        >
          {icon}
        </span>
      )}
    </button>
  );
}
