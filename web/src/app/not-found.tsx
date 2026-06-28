import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-gold-ink dark:text-gold">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
        Sayfa bulunamadı
      </h1>
      <p className="mt-2 text-muted">Aradığın sayfa taşınmış ya da hiç olmamış olabilir.</p>
      <Link href="/panom" className="mt-6">
        <Button variant="gold">Panoma dön</Button>
      </Link>
    </div>
  );
}
