import { describe, it, expect } from "vitest";
import { partitionEvents } from "@/lib/events/format";

const now = Date.UTC(2026, 5, 25, 12, 0, 0); // 2026-06-25T12:00:00Z

const events = [
  { id: "a", baslangic: "2026-06-20T10:00:00Z" }, // geçmiş
  { id: "b", baslangic: "2026-06-30T10:00:00Z" }, // yaklaşan
  { id: "c", baslangic: "2026-06-26T10:00:00Z" }, // yaklaşan (daha yakın)
  { id: "d", baslangic: "2026-06-10T10:00:00Z" }, // geçmiş (daha eski)
];

describe("partitionEvents", () => {
  it("yaklaşanları artan tarihe göre sıralar", () => {
    const { upcoming } = partitionEvents(events, now);
    expect(upcoming.map((e) => e.id)).toEqual(["c", "b"]);
  });

  it("geçmişi azalan (en yeni önce) sıralar", () => {
    const { past } = partitionEvents(events, now);
    expect(past.map((e) => e.id)).toEqual(["a", "d"]);
  });

  it("tam şimdi olan etkinlik yaklaşan sayılır (>=)", () => {
    const r = partitionEvents([{ id: "x", baslangic: new Date(now).toISOString() }], now);
    expect(r.upcoming.map((e) => e.id)).toEqual(["x"]);
    expect(r.past).toEqual([]);
  });

  it("geçersiz tarih geçmişe düşer (kırılmaz)", () => {
    const r = partitionEvents([{ id: "bad", baslangic: "not-a-date" }], now);
    expect(r.past.map((e) => e.id)).toEqual(["bad"]);
  });
});
