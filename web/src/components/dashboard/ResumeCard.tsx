import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRightIcon, PlayIcon } from "@/components/ui/icons";
import type { FlatLesson } from "@/lib/curriculum/types";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
        <p className="text-sm font-semibold text-success-fg">
          {allDone ? "Tüm dersleri tamamladın." : "Müfredat yakında eklenecek."}
        </p>
        {allDone && (
          <LinkButton href="/mufredat" variant="ghost">
            Müfredatı gör
          </LinkButton>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        href={`/mufredat/${resume.lesson.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative m-[7px] grid aspect-[21/8] place-items-center overflow-hidden rounded-2xl bg-navy-deep"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${resume.lesson.youtube_video_id}/hqdefault.jpg`}
          alt=""
          width={480}
          height={360}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded-md bg-navy-deep/85 px-2 py-1 text-xs font-semibold text-white">
          Kaldığın yerden
        </span>
        <span className="relative grid h-[54px] w-[54px] place-items-center rounded-full bg-accent text-navy">
          <PlayIcon size={22} />
        </span>
      </Link>
      <div className="px-6 pb-6 pt-4">
        <span className="text-xs font-semibold text-accent-fg">
          {resume.track.ad} · {resume.module.ad}
        </span>
        <h3 className="mb-3 mt-1 font-display text-xl font-bold text-fg">
          {resume.lesson.baslik}
        </h3>
        <ProgressBar pct={modulePct} label={`${resume.module.ad} ilerleme`} className="mb-2.5" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="min-w-0 text-2sm font-semibold text-muted">
            Modül %{modulePct} tamamlandı{kalanDk > 0 ? ` · ~${kalanDk} dk kaldı` : ""}
          </span>
          <LinkButton
            href={`/mufredat/${resume.lesson.id}`}
            variant="primary"
            icon={<ArrowRightIcon size={16} />}
            className="shrink-0"
          >
            Devam et
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
