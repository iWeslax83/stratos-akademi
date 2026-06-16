import type { Curriculum, FlatLesson, LessonStatus } from "./types";

export function isComplete(currentSeconds: number, durationSeconds: number): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return currentSeconds / durationSeconds >= 0.9;
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
