// Saniyeyi "10:31" ya da "1:02:03" olarak yazar; bilinmiyorsa "-".
export function formatSure(sn: number | null | undefined): string {
  if (sn == null || !Number.isFinite(sn) || sn <= 0) return "-";
  const h = Math.floor(sn / 3600);
  const m = Math.floor((sn % 3600) / 60);
  const s = Math.floor(sn % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
