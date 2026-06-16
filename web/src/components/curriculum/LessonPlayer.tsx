"use client";

import { useEffect, useRef, useState } from "react";
import { isComplete } from "@/lib/curriculum/progress";

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
}: {
  videoId: string;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const firedRef = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    firedRef.current = false;

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
              if (!firedRef.current && isComplete(p.getCurrentTime(), p.getDuration())) {
                firedRef.current = true;
                setDone(true);
                onComplete();
                if (interval) clearInterval(interval);
              }
            }, 5000);
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
  }, [videoId, onComplete]);

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
