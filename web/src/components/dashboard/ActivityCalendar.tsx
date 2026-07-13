import { buildActivityCalendar, activityLevel } from "@/lib/dashboard/calendar";

// 0..3 yoğunluk → düz turkuaz tonları (tek aksan rengi, gradyan yok).
const LEVEL_CLASS = [
  "bg-black/[0.05] dark:bg-white/[0.06]",
  "bg-accent-soft dark:bg-accent-dark",
  "bg-accent/55",
  "bg-accent",
];

const GUN_ETIKET = ["Pzt", "", "Çar", "", "Cum", "", "Paz"];

function formatDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

// Son 12 haftanın aktivite ızgarası (ders tamamlama + quiz denemesi).
export function ActivityCalendar({
  activityDates,
  today,
}: {
  activityDates: Date[];
  today: Date;
}) {
  const cal = buildActivityCalendar(activityDates, today, 12);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-navy dark:text-white">Aktivite</h2>
        <span className="text-sm text-muted">son 12 hafta · {cal.aktifGun} aktif gün</span>
      </div>
      <p className="mb-4 text-sm text-muted">Her kare bir gün; ders bitirdikçe ve quiz çözdükçe dolar.</p>

      <div className="flex gap-2.5">
        {/* Gün etiketleri */}
        <div className="flex flex-col gap-[3px] pt-[1px]">
          {GUN_ETIKET.map((g, i) => (
            <span key={i} className="h-3 text-[10px] leading-3 text-muted">
              {g}
            </span>
          ))}
        </div>

        {/* Hafta sütunları */}
        <div className="flex gap-[3px] overflow-x-auto">
          {cal.weeks.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {week.map((cell) =>
                cell.future ? (
                  <span key={cell.key} className="h-3 w-3" aria-hidden />
                ) : (
                  <span
                    key={cell.key}
                    className={`h-3 w-3 rounded-[3px] ${LEVEL_CLASS[activityLevel(cell.count)]}`}
                    title={
                      cell.count > 0
                        ? `${formatDay(cell.key)}: ${cell.count} aktivite`
                        : `${formatDay(cell.key)}: aktivite yok`
                    }
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lejant */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <span>az</span>
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} aria-hidden />
        ))}
        <span>çok</span>
      </div>
    </div>
  );
}
