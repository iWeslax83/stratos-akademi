import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail, pendingInvites } from "@/lib/admin/members";
import type { AllowlistRow, MemberRow } from "@/lib/admin/members";

describe("normalizeEmail", () => {
  it("trim + küçük harf", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("isValidEmail", () => {
  it("geçerli", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("emir.demir@okul.edu.tr")).toBe(true);
  });
  it("geçersiz", () => {
    expect(isValidEmail("abc")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("pendingInvites", () => {
  const A = (email: string): AllowlistRow => ({ email, role: "uye", created_at: "" });
  const M = (email: string): MemberRow => ({ id: email, email, ad: null, stratosiha_ad: null, role: "uye", created_at: "" });
  it("profili olmayan davetleri döner (büyük/küçük harf duyarsız)", () => {
    const r = pendingInvites([A("a@x.co"), A("b@x.co")], [M("A@x.co")]);
    expect(r.map((x) => x.email)).toEqual(["b@x.co"]);
  });
  it("üye yoksa hepsi bekler", () => {
    expect(pendingInvites([A("a@x.co")], []).length).toBe(1);
  });
  it("davet yoksa boş", () => {
    expect(pendingInvites([], [M("a@x.co")])).toEqual([]);
  });
});

import { cleanAd } from "@/lib/admin/members";

describe("cleanAd", () => {
  it("trim eder, geçerli adı döner", () => {
    expect(cleanAd("  Emir Sakarya  ")).toBe("Emir Sakarya");
  });
  it("boş ad reddedilir", () => {
    expect(cleanAd("")).toBeNull();
    expect(cleanAd("   ")).toBeNull();
  });
  it("60 karakterden uzun ad reddedilir", () => {
    expect(cleanAd("a".repeat(61))).toBeNull();
    expect(cleanAd("a".repeat(60))).toBe("a".repeat(60));
  });
});
