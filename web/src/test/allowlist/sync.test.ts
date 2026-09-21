import { describe, expect, test } from "vitest";
import { checkSyncToken, parseAllowlistEmail } from "@/lib/allowlist-sync";

const TOKEN = "allowlist-token-0123456789";

describe("checkSyncToken", () => {
  test("doğru Bearer token geçer", () => {
    expect(checkSyncToken(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
  });
  test("yanlış, eksik ya da biçimsiz header reddedilir", () => {
    expect(checkSyncToken("Bearer wrong-token-0123456789", TOKEN)).toBe(false);
    expect(checkSyncToken(TOKEN, TOKEN)).toBe(false);
    expect(checkSyncToken(null, TOKEN)).toBe(false);
  });
  test("beklenen token tanımsız ya da kısa ise fail-closed", () => {
    expect(checkSyncToken(`Bearer ${TOKEN}`, undefined)).toBe(false);
    expect(checkSyncToken("Bearer short", "short")).toBe(false);
  });
});

describe("parseAllowlistEmail", () => {
  test("trim eder ve küçük harfe çevirir", () => {
    expect(parseAllowlistEmail("  Ada@Example.COM ")).toEqual({ ok: true, email: "ada@example.com" });
  });
  test.each([[""], ["yanlis"], [null], [42], ["a@b"], ["a".repeat(250) + "@b.co"]])(
    "reddeder: %j",
    (bad) => {
      expect(parseAllowlistEmail(bad).ok).toBe(false);
    },
  );
});
