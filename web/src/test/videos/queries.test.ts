import { describe, it, expect } from "vitest";
import { buildQueries } from "@/lib/videos/queries";

const tracks = [{ id: "t1", ad: "Elektronik" }];
const modules = [
  { id: "m1", track_id: "t1", ad: "Temel Elektronik" },
  { id: "m2", track_id: "t1", ad: "Lehimleme" },
];

describe("buildQueries", () => {
  it("her modül için track+modül adından tek sorgu üretir", () => {
    const qs = buildQueries(tracks, modules);
    expect(qs).toContain("Elektronik Temel Elektronik");
    expect(qs).toContain("Elektronik Lehimleme");
    expect(qs).toHaveLength(2);
  });

  it("track'i olmayan modülü atlar", () => {
    const qs = buildQueries(tracks, [{ id: "m3", track_id: "yok", ad: "Öksüz" }]);
    expect(qs).toEqual([]);
  });

  it("aynı sorguyu tekrarlamaz", () => {
    const dup = [
      { id: "m1", track_id: "t1", ad: "Aynı" },
      { id: "m2", track_id: "t1", ad: "Aynı" },
    ];
    expect(buildQueries(tracks, dup)).toEqual(["Elektronik Aynı"]);
  });
});
