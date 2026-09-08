import { LinkButton } from "@/components/ui/LinkButton";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[1180px] flex-col items-center justify-center px-4 text-center sm:px-6">
      <p className="font-display text-6xl font-extrabold text-accent-ink dark:text-accent">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
        Sayfa bulunamadı
      </h1>
      <p className="mt-2 text-muted">Aradığın sayfa taşınmış ya da hiç olmamış olabilir.</p>
      <LinkButton href="/panom" variant="accent" className="mt-6">
        Panoma dön
      </LinkButton>
    </div>
  );
}
