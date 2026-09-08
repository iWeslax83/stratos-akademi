"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonPlayer, type WatchStats } from "./LessonPlayer";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { FormError } from "@/components/ui/FormError";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const statsRef = useRef<WatchStats>({ watched: 0, position: 0 });

  const onEligible = useCallback(() => setEligible(true), []);
  const onProgress = useCallback((s: WatchStats) => {
    statsRef.current = s;
  }, []);

  const complete = useCallback(
    (stats?: WatchStats) => {
      const s = stats ?? statsRef.current;
      startTransition(async () => {
        const res = await markLessonComplete(lessonId, s.watched, s.position);
        if (res.ok) {
          setCompleted(true);
          setError(null);
          router.refresh();
        } else {
          setError(res.error ?? "Kaydedilemedi.");
        }
      });
    },
    [lessonId, router],
  );

  return (
    <div>
      <LessonPlayer
        videoId={videoId}
        onComplete={complete}
        onManualEligible={onEligible}
        onProgress={onProgress}
      />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-green-600/30 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:border-green-400/25 dark:bg-green-900/30 dark:text-green-300">
            <CheckIcon size={16} />
            Tamamlandı
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Button variant="ghost" onClick={() => complete()} disabled={isPending || !eligible}>
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
          <LinkButton href={nextHref} variant="primary" icon={<ArrowRightIcon size={16} />}>
            Sonraki ders
          </LinkButton>
        )}
      </div>
      <FormError className="mt-2">{error}</FormError>
    </div>
  );
}
