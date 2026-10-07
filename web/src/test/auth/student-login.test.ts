// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { clientIp, consumeAttempt, verifyTurnstile } from "@/lib/auth/student-login";
import { makeSvc } from "./fake-svc";

describe("clientIp", () => {
  test("x-forwarded-for ilk değeri", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  test("x-real-ip yedeği, sonra unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("verifyTurnstile", () => {
  const ok = vi.fn(async () => Response.json({ success: true }));
  const no = vi.fn(async () => Response.json({ success: false }));

  test("success true ise geçer ve secret/response/remoteip gönderir", async () => {
    expect(await verifyTurnstile("tok", "1.2.3.4", "secret", ok as unknown as typeof fetch)).toBe(true);
    const [url, init] = ok.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = String(init.body);
    expect(body).toContain("secret=secret");
    expect(body).toContain("response=tok");
    expect(body).toContain("remoteip=1.2.3.4");
  });
  test("success false reddedilir", async () => {
    expect(await verifyTurnstile("tok", "ip", "secret", no as unknown as typeof fetch)).toBe(false);
  });
  test("secret yoksa fail-closed ve ağ isteği atılmaz", async () => {
    const f = vi.fn();
    expect(await verifyTurnstile("tok", "ip", undefined, f as unknown as typeof fetch)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  test.each([[""], [undefined], [null], [42], ["x".repeat(3000)]])("geçersiz token reddedilir: %j", async (t) => {
    const f = vi.fn();
    expect(await verifyTurnstile(t, "ip", "secret", f as unknown as typeof fetch)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  test("ağ hatası, HTTP hatası ve bozuk JSON false döner, fırlatmaz", async () => {
    const boom = vi.fn(async () => {
      throw new Error("ağ");
    });
    const http500 = vi.fn(async () => new Response("x", { status: 500 }));
    const badJson = vi.fn(async () => new Response("<html>", { status: 200 }));
    expect(await verifyTurnstile("t", "ip", "s", boom as unknown as typeof fetch)).toBe(false);
    expect(await verifyTurnstile("t", "ip", "s", http500 as unknown as typeof fetch)).toBe(false);
    expect(await verifyTurnstile("t", "ip", "s", badJson as unknown as typeof fetch)).toBe(false);
  });
});

describe("consumeAttempt", () => {
  test("sınır altında ok ve deneme kaydedilir", async () => {
    const inserts: unknown[] = [];
    const svc = makeSvc({ ipCount: 9, noCount: 4, inserts });
    expect(await consumeAttempt(svc as never, "1.1.1.1", "1234")).toBe("ok");
    expect(inserts).toEqual([{ ip: "1.1.1.1", student_no: "1234" }]);
  });
  test("IP sınırı (10) dolunca limited ve kayıt eklenmez", async () => {
    const inserts: unknown[] = [];
    expect(await consumeAttempt(makeSvc({ ipCount: 10, inserts }) as never, "1.1.1.1", "1234")).toBe("limited");
    expect(inserts).toEqual([]);
  });
  test("numara sınırı (5) dolunca limited", async () => {
    expect(await consumeAttempt(makeSvc({ noCount: 5 }) as never, "1.1.1.1", "1234")).toBe("limited");
  });
  test("sayım hatası ve ekleme hatası error (fail-closed)", async () => {
    expect(await consumeAttempt(makeSvc({ countError: true }) as never, "ip", "1234")).toBe("error");
    expect(await consumeAttempt(makeSvc({ insertError: true }) as never, "ip", "1234")).toBe("error");
  });
});
