"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LessonPlayer } from "./LessonPlayer";
import { Button } from "@/components/ui/Button";
import { markLessonComplete } from "@/app/actions/lessons";

export function LessonSection({
  lessonId,
  videoId,
  initiallyCompleted,
  nextHref,
}: {
  lessonId: string;
  videoId: string;
  initiallyCompleted: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [isPending, startTransition] = useTransition();

  const complete = useCallback(() => {
    startTransition(async () => {
      const res = await markLessonComplete(lessonId);
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    });
  }, [lessonId, router]);

  return (
    <div>
      <LessonPlayer videoId={videoId} onComplete={complete} />
      <div className="mt-5 flex items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ✓ Tamamlandı
          </span>
        ) : (
          <Button variant="ghost" onClick={complete} disabled={isPending}>
            {isPending ? "Kaydediliyor…" : "İzledim"}
          </Button>
        )}
        {nextHref && (
          <Link href={nextHref}>
            <Button variant="primary" icon="→">
              Sonraki ders
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
