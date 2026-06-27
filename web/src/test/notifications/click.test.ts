import { describe, it, expect } from "vitest";
import { resolveClick } from "@/lib/notifications/click";

describe("resolveClick", () => {
  it("okunmamış + link → işaretle ve git", () => {
    expect(resolveClick(false, "/mufredat/x")).toEqual({
      mark: true,
      navigateTo: "/mufredat/x",
      refresh: false,
    });
  });

  it("okunmamış + linksiz → işaretle ve tazele", () => {
    expect(resolveClick(false, null)).toEqual({ mark: true, navigateTo: null, refresh: true });
  });

  it("okunmuş + link → işaretleme, sadece git", () => {
    expect(resolveClick(true, "/duyurular")).toEqual({
      mark: false,
      navigateTo: "/duyurular",
      refresh: false,
    });
  });

  it("okunmuş + linksiz → hiçbir şey yapma", () => {
    expect(resolveClick(true, null)).toEqual({ mark: false, navigateTo: null, refresh: false });
  });
});
