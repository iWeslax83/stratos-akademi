import { describe, it, expect } from "vitest";
import { authorize } from "@/app/api/cron/video-tara/route";

describe("authorize", () => {
  it("doğru Bearer token'ı kabul eder", () => {
    const req = new Request("http://x", { headers: { authorization: "Bearer secret123" } });
    expect(authorize(req, "secret123")).toBe(true);
  });
  it("yanlış token'ı reddeder", () => {
    const req = new Request("http://x", { headers: { authorization: "Bearer nope" } });
    expect(authorize(req, "secret123")).toBe(false);
  });
  it("başlık yoksa reddeder", () => {
    expect(authorize(new Request("http://x"), "secret123")).toBe(false);
  });
  it("secret tanımsızsa reddeder", () => {
    const req = new Request("http://x", { headers: { authorization: "Bearer " } });
    expect(authorize(req, undefined)).toBe(false);
  });
});
