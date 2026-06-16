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
  const [eligible, setEligible] = useState(initiallyCompleted);
  const [isPending, startTransition] = useTransition();

  const onEligible = useCallback(() => setEligible(true), []);

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
      <LessonPlayer videoId={videoId} onComplete={complete} onManualEligible={onEligible} />
      <div className="mt-5 flex items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ✓ Tamamlandı
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Button variant="ghost" onClick={complete} disabled={isPending || !eligible}>
              {isPending ? "Kaydediliyor…" : "İzledim"}
            </Button>
            {!eligible && (
              <span className="text-xs text-muted">
                Videonun en az %20&apos;sini izleyince aktifleşir.
              </span>
            )}
          </div>
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
