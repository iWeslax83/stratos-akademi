import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { FlatLesson } from "@/lib/curriculum/types";

export function ResumeCard({
  resume,
  modulePct,
  kalanDk,
  allDone,
}: {
  resume: FlatLesson | null;
  modulePct: number;
  kalanDk: number;
  allDone: boolean;
}) {
  if (!resume) {
    return (
      <div className="flex h-full items-center justify-between gap-4 p-6">
        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
          {allDone ? "Tüm dersleri tamamladın." : "Müfredat yakında eklenecek."}
        </p>
        {allDone && (
          <Link href="/mufredat">
            <Button variant="ghost">Müfredatı gör</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative m-[7px] grid aspect-[21/8] place-items-center overflow-hidden rounded-2xl bg-navy-deep">
        <span className="absolute left-3.5 top-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#cdd8ec]">
          Kaldığın yerden
        </span>
        <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-accent text-xl text-navy shadow-[0_16px_36px_-12px_rgba(79,179,191,0.6)]">
          ▶
        </span>
      </div>
      <div className="px-6 pb-6 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-ink dark:text-accent">
          {resume.track.ad} · {resume.module.ad}
        </span>
        <h3 className="mb-3 mt-1 font-display text-xl font-bold text-navy dark:text-white">
          {resume.lesson.baslik}
        </h3>
        <div className="mb-2.5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-accent" style={{ width: `${modulePct}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="min-w-0 text-[13px] font-semibold text-muted">
            Modül %{modulePct} tamamlandı{kalanDk > 0 ? ` · ~${kalanDk} dk kaldı` : ""}
          </span>
          <Link href={`/mufredat/${resume.lesson.id}`} className="shrink-0">
            <Button variant="primary" icon="→">
              Devam et
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
