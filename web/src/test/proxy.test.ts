import { describe, it, expect } from "vitest";
import { isPublicPath } from "@/proxy";

describe("isPublicPath", () => {
  it("giriş ve auth geri dönüşü herkese açık", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/offline")).toBe(true);
  });

  it("cron uç noktası açık — kendi Bearer doğrulamasını yapar", () => {
    // Aksi halde GitHub Actions cron'u /login'e yönlendirilir ve tarama hiç koşmaz.
    expect(isPublicPath("/api/cron/video-tara")).toBe(true);
  });

  it("korumalı sayfalar açık değil", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/mufredat")).toBe(false);
    expect(isPublicPath("/admin/oneriler")).toBe(false);
  });

  it("önek benzerliğiyle kandırılamaz", () => {
    expect(isPublicPath("/loginhack")).toBe(false);
    expect(isPublicPath("/api/cronx")).toBe(false);
  });
});
