import type { UyeSatiri } from "@/lib/admin/rapor";

export function sonEtkinlikMetni(gun: number | null): string {
  if (gun === null) return "hiç";
  if (gun === 0) return "bugün";
  return `${gun} gün önce`;
}

// Üye katılımı: karşılaştırılacak sayılar olduğu için gerçek tablo (satır/sütun başlıkları
// ekran okuyucuda gezilebilir, sayılar tabular-nums ile hizalı).
export function UyeKatilimTablosu({ uyeler }: { uyeler: UyeSatiri[] }) {
  if (uyeler.length === 0) return <p className="text-sm text-muted">Üye yok.</p>;
  const th = "py-2 text-xs font-semibold text-muted";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <caption className="sr-only">Üye katılımı</caption>
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th scope="col" className={`${th} text-left`}>Üye</th>
            <th scope="col" className={`${th} text-right`}>Ders</th>
            <th scope="col" className={`${th} text-right`}>Puan</th>
            <th scope="col" className={`${th} pl-4 text-right`}>Son etkinlik</th>
          </tr>
        </thead>
        <tbody>
          {uyeler.map((u) => (
            <tr key={u.id} className="border-b border-[var(--line)] last:border-b-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-bold text-fg">{u.ad}</th>
              <td className="py-2.5 text-right tabular-nums text-muted">{u.ders}</td>
              <td className="py-2.5 text-right tabular-nums text-muted">{u.puan}</td>
              <td
                className={
                  u.aktif
                    ? "py-2.5 pl-4 text-right text-xs font-semibold text-success-fg"
                    : "py-2.5 pl-4 text-right text-xs font-semibold text-muted"
                }
              >
                {sonEtkinlikMetni(u.gun)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
