import { describe, it, expect } from "vitest";
import { normalizeEmail, isAllowed } from "@/lib/auth/allowlist";

describe("normalizeEmail", () => {
  it("küçük harfe çevirir ve boşlukları kırpar", () => {
    expect(normalizeEmail("  Emir@Gmail.COM ")).toBe("emir@gmail.com");
  });
});

describe("isAllowed", () => {
  const list = ["admin@stratos.com", "uye@stratos.com"];
  it("listedeki e-posta için true döner (büyük/küçük harf duyarsız)", () => {
    expect(isAllowed("ADMIN@stratos.com", list)).toBe(true);
  });
  it("listede olmayan için false döner", () => {
    expect(isAllowed("yabanci@x.com", list)).toBe(false);
  });
});
