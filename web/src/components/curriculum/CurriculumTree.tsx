import Link from "next/link";
import { clsx } from "clsx";
import type { Curriculum, LessonStatus } from "@/lib/curriculum/types";

const ICON: Record<LessonStatus, string> = { done: "✓", current: "●", todo: "○" };
const STATUS_LABEL: Record<LessonStatus, string> = {
  done: "Tamamlandı",
  current: "Devam ediyor",
  todo: "Yapılacak",
};

export function CurriculumTree({
  curriculum,
  statuses,
  activeLessonId,
}: {
  curriculum: Curriculum;
  statuses: Map<string, LessonStatus>;
  activeLessonId: string | null;
}) {
  return (
    <nav className="space-y-5">
      {curriculum.map((track) => (
        <div key={track.id}>
          <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-ink dark:text-accent">
            <span>{track.ikon}</span>
            <span>{track.ad}</span>
          </div>
          {track.modules.map((module) => (
            <div key={module.id} className="mb-2">
              <div className="px-1 py-1 text-xs font-semibold text-muted">{module.ad}</div>
              <ul>
                {module.lessons.map((lesson) => {
                  const status = statuses.get(lesson.id) ?? "todo";
                  const active = lesson.id === activeLessonId;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/mufredat/${lesson.id}`}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold",
                          active
                            ? "bg-accent-soft text-accent-ink dark:bg-accent-dark dark:text-accent"
                            : status === "done"
                              ? "text-navy dark:text-white"
                              : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                        )}
                      >
                        <span
                          data-testid={`status-${lesson.id}`}
                          className={clsx(
                            "grid h-4 w-4 flex-none place-items-center text-[10px]",
                            status === "done" && "text-green-600",
                            status === "current" && "text-accent-ink dark:text-accent",
                          )}
                        >
                          <span aria-hidden="true">{ICON[status]}</span>
                          <span className="sr-only">{STATUS_LABEL[status]}</span>
                        </span>
                        <span className="truncate">{lesson.baslik}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
