import { describe, it, expect } from "vitest";
import { buildActivityCalendar, activityLevel } from "@/lib/dashboard/calendar";

// Sabit referans: 2026-06-24 Çarşamba (Istanbul). Noon UTC kullanıyoruz ki gün kaymasın.
const today = new Date("2026-06-24T12:00:00Z");

describe("activityLevel", () => {
  it("0 → 0, 1 → 1, 2-3 → 2, 4+ → 3", () => {
    expect(activityLevel(0)).toBe(0);
    expect(activityLevel(1)).toBe(1);
    expect(activityLevel(2)).toBe(2);
    expect(activityLevel(3)).toBe(2);
    expect(activityLevel(4)).toBe(3);
    expect(activityLevel(10)).toBe(3);
  });
});

describe("buildActivityCalendar", () => {
  it("weeks sütun, 7 gün satır üretir", () => {
    const cal = buildActivityCalendar([], today, 12);
    expect(cal.weeks).toHaveLength(12);
    for (const w of cal.weeks) expect(w).toHaveLength(7);
  });

  it("ızgara Pazartesi ile başlar", () => {
    const cal = buildActivityCalendar([], today, 4);
    // İlk hücrenin gün anahtarından haftanın günü Pazartesi olmalı.
    const first = cal.weeks[0][0].key;
    const dow = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
    expect(dow).toBe(0); // Pzt=0
  });

  it("son sütun bugünü içerir", () => {
    const cal = buildActivityCalendar([], today, 12);
    const lastWeek = cal.weeks[cal.weeks.length - 1];
    const keys = lastWeek.map((c) => c.key);
    expect(keys).toContain("2026-06-24");
  });

  it("bugünden sonraki günler future=true ve sayılmaz", () => {
    // Çarşamba bugün → aynı haftanın Perşembe/Cuma/Cmt/Paz future.
    const cal = buildActivityCalendar([], today, 12);
    const lastWeek = cal.weeks[cal.weeks.length - 1];
    const future = lastWeek.filter((c) => c.future).map((c) => c.key);
    expect(future).toEqual(["2026-06-25", "2026-06-26", "2026-06-27", "2026-06-28"]);
  });

  it("aktiviteleri doğru güne sayar", () => {
    const dates = [
      new Date("2026-06-24T08:00:00Z"), // bugün
      new Date("2026-06-24T20:00:00Z"), // bugün (2. aktivite)
      new Date("2026-06-23T10:00:00Z"), // dün
    ];
    const cal = buildActivityCalendar(dates, today, 12);
    expect(cal.toplam).toBe(3);
    expect(cal.aktifGun).toBe(2);
    const all = cal.weeks.flat();
    expect(all.find((c) => c.key === "2026-06-24")!.count).toBe(2);
    expect(all.find((c) => c.key === "2026-06-23")!.count).toBe(1);
  });

  it("ızgara dışındaki eski aktiviteler sayılmaz", () => {
    const dates = [new Date("2020-01-01T10:00:00Z")];
    const cal = buildActivityCalendar(dates, today, 12);
    expect(cal.toplam).toBe(0);
    expect(cal.aktifGun).toBe(0);
  });
});
