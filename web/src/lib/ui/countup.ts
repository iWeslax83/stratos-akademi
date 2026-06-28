// CountUp saf mantığı (test edilebilir). Bileşen bunları requestAnimationFrame ile kullanır.

export function clamp01(t: number): number {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

// Yumuşak yavaşlayan giriş (ease-out cubic).
export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

// 0'dan target'a, ilerleme (0..1) için gösterilecek tamsayı değer.
export function countValue(target: number, progress: number): number {
  return Math.round(target * easeOutCubic(progress));
}
