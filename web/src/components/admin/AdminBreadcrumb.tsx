import Link from "next/link";

export function AdminBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-fg">
              {it.label}
            </Link>
          ) : (
            <span className="text-fg">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
