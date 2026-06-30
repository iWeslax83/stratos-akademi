// Rota geçişlerinde gösterilen iskelet (force-dynamic sayfalar veri çekerken).
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-12 pt-6 sm:px-6">
      <div className="h-14 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
      <div className="mt-8 h-9 w-56 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
      <div className="mt-6 grid gap-[18px] sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-bezel bg-black/5 dark:bg-white/5" />
        <div className="h-44 animate-pulse rounded-bezel bg-black/5 dark:bg-white/5" />
        <div className="h-44 animate-pulse rounded-bezel bg-black/5 dark:bg-white/5" />
        <div className="h-44 animate-pulse rounded-bezel bg-black/5 dark:bg-white/5" />
      </div>
    </div>
  );
}
