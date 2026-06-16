import type { Curriculum, FlatLesson, LessonStatus } from "./types";

export const POSITION_THRESHOLD = 0.9;
export const WATCHED_THRESHOLD = 0.2;
const MAX_PLAYBACK_STEP = 1.5;

// Tamamlanma: hem videonun sonuna gelinmeli (konum ≥%90) HEM de gerçekten
// oynatılarak izlenen süre toplamı ≥%20 olmalı. Böylece sona atlamak yetmez.
// Kümülatif gerçekten izlenen süre videonun ≥%20'si mi? (manuel butonun da kapısı)
export function hasWatchedEnough(watchedSeconds: number, durationSeconds: number): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return watchedSeconds / durationSeconds >= WATCHED_THRESHOLD;
}

export function isComplete(
  currentSeconds: number,
  durationSeconds: number,
  watchedSeconds: number,
): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return (
    currentSeconds / durationSeconds >= POSITION_THRESHOLD &&
    hasWatchedEnough(watchedSeconds, durationSeconds)
  );
}

// Yalnız normal oynatma ilerlemesini (küçük, ileri adım) biriktirir;
// ileri atlama (büyük sıçrama) ve geri sarma sayılmaz.
export function accumulateWatched(
  prevWatched: number,
  lastTime: number,
  currentTime: number,
  maxStep: number = MAX_PLAYBACK_STEP,
): number {
  const delta = currentTime - lastTime;
  if (delta > 0 && delta <= maxStep) return prevWatched + delta;
  return prevWatched;
}

export function flatten(curriculum: Curriculum): FlatLesson[] {
  const out: FlatLesson[] = [];
  for (const track of [...curriculum].sort((a, b) => a.sira - b.sira)) {
    for (const module of [...track.modules].sort((a, b) => a.sira - b.sira)) {
      for (const lesson of [...module.lessons].sort((a, b) => a.sira - b.sira)) {
        out.push({ lesson, module, track });
      }
    }
  }
  return out;
}

export function computeStatuses(
  curriculum: Curriculum,
  completedIds: Set<string>,
): Map<string, LessonStatus> {
  const map = new Map<string, LessonStatus>();
  let currentAssigned = false;
  for (const { lesson } of flatten(curriculum)) {
    if (completedIds.has(lesson.id)) {
      map.set(lesson.id, "done");
    } else if (!currentAssigned) {
      map.set(lesson.id, "current");
      currentAssigned = true;
    } else {
      map.set(lesson.id, "todo");
    }
  }
  return map;
}

export function resumeLessonId(curriculum: Curriculum, completedIds: Set<string>): string | null {
  for (const { lesson } of flatten(curriculum)) {
    if (!completedIds.has(lesson.id)) return lesson.id;
  }
  return null;
}

export function overallProgress(
  curriculum: Curriculum,
  completedIds: Set<string>,
): { done: number; total: number; pct: number } {
  const all = flatten(curriculum);
  const total = all.length;
  const done = all.filter((f) => completedIds.has(f.lesson.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function findNext(curriculum: Curriculum, lessonId: string): FlatLesson | null {
  const all = flatten(curriculum);
  const idx = all.findIndex((f) => f.lesson.id === lessonId);
  if (idx === -1 || idx + 1 >= all.length) return null;
  return all[idx + 1];
}
