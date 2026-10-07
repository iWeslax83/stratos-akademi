// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const TOKEN = "allowlist-token-0123456789";

const m = vi.hoisted(() => ({
  existing: null as null | { email: string; student_no: string | null },
  insertError: null as null | { code: string; message: string },
  updateError: null as null | { code: string; message: string },
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: m.existing, error: null }) }) }),
      insert: async (row: unknown) => {
        m.insert(row);
        return { error: m.insertError };
      },
      update: (row: unknown) => ({
        eq: (_col: string, email: string) => ({
          is: async (col: string, val: unknown) => {
            m.update(row, email, col, val);
            return { error: m.updateError };
          },
        }),
      }),
    }),
  }),
}));

const { POST } = await import("@/app/api/allowlist/route");

function req(body: unknown, token: string | null = TOKEN) {
  return new Request("http://localhost/api/allowlist", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.existing = null;
  m.insertError = null;
  m.updateError = null;
  process.env.ALLOWLIST_SYNC_TOKEN = TOKEN;
});

describe("POST /api/allowlist", () => {
  test("token yoksa 401", async () => {
    expect((await POST(req({ email: "a@b.co" }, null))).status).toBe(401);
  });

  test("yeni üye: rol uye, numara ile eklenir", async () => {
    const res = await POST(req({ email: "Ada@Example.com", okulNo: "1234" }));
    expect(res.status).toBe(200);
    expect(m.insert).toHaveBeenCalledWith({ email: "ada@example.com", role: "uye", student_no: "1234" });
  });

  test("numarasız eski çağrı hâlâ çalışır, student_no gönderilmez", async () => {
    const res = await POST(req({ email: "ada@example.com" }));
    expect(res.status).toBe(200);
    expect(m.insert).toHaveBeenCalledWith({ email: "ada@example.com", role: "uye" });
  });

  test("geçersiz numara 400", async () => {
    const res = await POST(req({ email: "ada@example.com", okulNo: "12a" }));
    expect(res.status).toBe(400);
    expect(m.insert).not.toHaveBeenCalled();
  });

  test("e-posta zaten varsa yalnız student_no güncellenir, rol ezilmez", async () => {
    m.existing = { email: "ada@example.com", student_no: null };
    const res = await POST(req({ email: "ada@example.com", okulNo: "1234" }));
    expect(res.status).toBe(200);
    expect(m.insert).not.toHaveBeenCalled();
    // Yalnız boş numara doldurulur: .is("student_no", null) koruması şart.
    expect(m.update).toHaveBeenCalledWith({ student_no: "1234" }, "ada@example.com", "student_no", null);
  });

  test("numara zaten aynıysa güncelleme yok", async () => {
    m.existing = { email: "ada@example.com", student_no: "1234" };
    const res = await POST(req({ email: "ada@example.com", okulNo: "1234" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(m.update).not.toHaveBeenCalled();
  });

  test("kayıtlı numara farklıysa ezilmez, skipped_mismatch döner", async () => {
    m.existing = { email: "ada@example.com", student_no: "1111" };
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(req({ email: "ada@example.com", okulNo: "9999" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, studentNo: "skipped_mismatch" });
    expect(m.update).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("numara başka e-postadaysa (yeni satır): e-posta numarasız eklenir, çakışma bildirilir", async () => {
    m.insertError = { code: "23505", message: 'violates unique constraint "allowlist_student_no_key"' };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req({ email: "yeni@example.com", okulNo: "1234" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, studentNo: "skipped_conflict" });
    expect(m.insert).toHaveBeenNthCalledWith(1, { email: "yeni@example.com", role: "uye", student_no: "1234" });
    expect(m.insert).toHaveBeenNthCalledWith(2, { email: "yeni@example.com", role: "uye" });
    spy.mockRestore();
  });

  test("numara başka e-postadaysa (var olan satır güncellenirken): ilk sahibin numarası ezilmez", async () => {
    m.existing = { email: "ada@example.com", student_no: null };
    m.updateError = { code: "23505", message: 'violates unique constraint "allowlist_student_no_key"' };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req({ email: "ada@example.com", okulNo: "1234" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, studentNo: "skipped_conflict" });
    spy.mockRestore();
  });

  test("beklenmeyen DB hatası 500", async () => {
    m.insertError = { code: "42501", message: "permission denied" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(req({ email: "ada@example.com", okulNo: "1234" }))).status).toBe(500);
    spy.mockRestore();
  });
});
