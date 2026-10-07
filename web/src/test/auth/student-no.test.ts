import { describe, expect, test } from "vitest";
import { normalizeStudentNo } from "@/lib/student-no";

describe("normalizeStudentNo", () => {
  test("rakamları kırpıp string döner", () => {
    expect(normalizeStudentNo(" 1234 ")).toBe("1234");
    expect(normalizeStudentNo("0123")).toBe("0123");
  });
  test("baştaki sıfır farklı numaradır", () => {
    expect(normalizeStudentNo("0123")).not.toBe(normalizeStudentNo("123"));
  });
  test("10 haneye kadar kabul, 11 hane red", () => {
    expect(normalizeStudentNo("1234567890")).toBe("1234567890");
    expect(normalizeStudentNo("12345678901")).toBeNull();
  });
  test.each([[""], ["  "], ["12a4"], ["12 34"], ["-12"], ["1.5"], [null], [undefined], [1234], [{}]])(
    "reddeder: %j",
    (bad) => {
      expect(normalizeStudentNo(bad)).toBeNull();
    },
  );
});
