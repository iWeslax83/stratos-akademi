import { describe, expect, test } from "vitest";
import { checkSyncToken, parseAllowlistEmail, parseApplicantName, parseOkulNo, isStudentNoConflict } from "@/lib/allowlist-sync";

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

describe("parseOkulNo", () => {
  test("eksik ya da null ise numara yok sayılır", () => {
    expect(parseOkulNo(undefined)).toEqual({ ok: true, okulNo: null });
    expect(parseOkulNo(null)).toEqual({ ok: true, okulNo: null });
  });
  test("geçerli numarayı kırpar", () => {
    expect(parseOkulNo(" 1234 ")).toEqual({ ok: true, okulNo: "1234" });
  });
  test.each([[""], ["12a"], ["12345678901"], [1234], [{}]])("reddeder: %j", (bad) => {
    expect(parseOkulNo(bad).ok).toBe(false);
  });
});

describe("isStudentNoConflict", () => {
  test("yalnız numara dizini çakışması true", () => {
    const msg = 'duplicate key value violates unique constraint "allowlist_student_no_key"';
    expect(isStudentNoConflict({ code: "23505", message: msg })).toBe(true);
    expect(isStudentNoConflict({ code: "23505", message: 'violates unique constraint "allowlist_pkey"' })).toBe(false);
    expect(isStudentNoConflict({ code: "42501", message: msg })).toBe(false);
    expect(isStudentNoConflict(null)).toBe(false);
  });
});

describe("parseApplicantName", () => {
  test("Türkçe kurallarıyla her kelimenin ilk harfi büyük", () => {
    expect(parseApplicantName("HALİL UMUT SALCAN")).toEqual({ ok: true, name: "Halil Umut Salcan" });
    expect(parseApplicantName("ibrahim yüzak")).toEqual({ ok: true, name: "İbrahim Yüzak" });
    expect(parseApplicantName("Ahmet Tuna KINDIRA")).toEqual({ ok: true, name: "Ahmet Tuna Kındıra" });
    expect(parseApplicantName("Muhammet Ali ÇAMUR")).toEqual({ ok: true, name: "Muhammet Ali Çamur" });
  });
  test("fazla boşlukları toplar, tireli adları da düzeltir", () => {
    expect(parseApplicantName("  ayşe   nur  ")).toEqual({ ok: true, name: "Ayşe Nur" });
    expect(parseApplicantName("ali-rıza KAYA")).toEqual({ ok: true, name: "Ali-Rıza Kaya" });
  });
  test("ad gönderilmediyse null döner", () => {
    expect(parseApplicantName(undefined)).toEqual({ ok: true, name: null });
    expect(parseApplicantName(null)).toEqual({ ok: true, name: null });
  });
  test.each([[""], ["   "], [42], ["a".repeat(101)]])("reddeder: %j", (bad) => {
    expect(parseApplicantName(bad).ok).toBe(false);
  });
});
