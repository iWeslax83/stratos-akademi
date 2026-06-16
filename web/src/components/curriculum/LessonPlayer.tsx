"use client";

import { useEffect, useRef, useState } from "react";
import { isComplete, accumulateWatched, hasWatchedEnough } from "@/lib/curriculum/progress";

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YtPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function LessonPlayer({
  videoId,
  onComplete,
  onManualEligible,
}: {
  videoId: string;
  onComplete: () => void;
  onManualEligible?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const firedRef = useRef(false);
  const eligibleFiredRef = useRef(false);
  const lastTimeRef = useRef(0);
  const watchedRef = useRef(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    firedRef.current = false;
    eligibleFiredRef.current = false;
    lastTimeRef.current = 0;
    watchedRef.current = 0;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            interval = setInterval(() => {
              const p = playerRef.current;
              if (!p || typeof p.getCurrentTime !== "function") return;
              const cur = p.getCurrentTime();
              const dur = p.getDuration();
              watchedRef.current = accumulateWatched(watchedRef.current, lastTimeRef.current, cur);
              lastTimeRef.current = cur;
              if (!eligibleFiredRef.current && hasWatchedEnough(watchedRef.current, dur)) {
                eligibleFiredRef.current = true;
                onManualEligible?.();
              }
              if (!firedRef.current && isComplete(cur, dur, watchedRef.current)) {
                firedRef.current = true;
                setDone(true);
                onComplete();
                if (interval) clearInterval(interval);
              }
            }, 1000);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, onComplete, onManualEligible]);

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-core bg-black">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {done && (
        <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-400">
          ✓ Bu ders tamamlandı olarak işaretlendi
        </p>
      )}
    </div>
  );
}
