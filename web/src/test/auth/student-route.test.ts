// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeSvc, type SvcOpts } from "./fake-svc";

const m = vi.hoisted(() => ({ svc: null as unknown, verifyOtp: vi.fn() }));

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => m.svc }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp: m.verifyOtp } }),
}));

const { POST } = await import("@/app/auth/student/route");

const GENERIC = "Numara bulunamadı veya giriş yapılamadı.";

function setup(opts: SvcOpts = {}, turnstile: "ok" | "fail" | "throw" = "ok") {
  m.svc = makeSvc({ allow: { email: "ada@example.com", role: "uye" }, ...opts });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (turnstile === "throw") throw new Error("ağ");
      return Response.json({ success: turnstile === "ok" });
    }),
  );
}

const SAME_ORIGIN = { origin: "http://localhost", host: "localhost", "content-type": "application/json" };

function req(body: unknown, headers: Record<string, string> = SAME_ORIGIN) {
  return new Request("http://localhost/auth/student", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.verifyOtp.mockResolvedValue({ error: null });
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
});

describe("POST /auth/student", () => {
  test("bozuk gövde ve geçersiz numara 400", async () => {
    setup();
    expect((await POST(req("{"))).status).toBe(400);
    expect((await POST(req({ studentNo: "12a", token: "t" }))).status).toBe(400);
    expect((await POST(req({ studentNo: "0123x", token: "t" }))).status).toBe(400);
  });

  test("rate limit dolunca 429, Turnstile ve oturum denenmez", async () => {
    setup({ noCount: 5 });
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(429);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("sayım hatasında 500 (kapı açık kalmaz)", async () => {
    setup({ countError: true });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(500);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("Turnstile başarısızsa 400 ve oturum açılmaz", async () => {
    setup({}, "fail");
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(400);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("Turnstile ağ hatası fırlatmaz, 400 döner", async () => {
    setup({}, "throw");
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(400);
  });

  test("Turnstile secret tanımsızsa giriş kapalı", async () => {
    setup();
    delete process.env.TURNSTILE_SECRET_KEY;
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(400);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("olmayan numara genel mesajla 401", async () => {
    setup({ allow: null });
    const res = await POST(req({ studentNo: "9999", token: "t" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe(GENERIC);
  });

  test("allowlist'te admin rolü olan genel mesajla 401, bilgi sızmaz", async () => {
    setup({ allow: { email: "kaptan@example.com", role: "admin" } });
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe(GENERIC);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("allowlist uye ama profil admin (roller ayrışmış) yine reddedilir", async () => {
    setup({ profile: { id: "u1", role: "admin" } });
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(401);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("hesabı olmayan üyeye hesap açılır, magic link doğrulanır", async () => {
    const createUser = vi.fn(async () => ({ data: {}, error: null }));
    const generateLink = vi.fn(async () => ({
      data: { properties: { hashed_token: "h1" }, user: { id: "u1" } },
      error: null,
    }));
    setup({ profile: null, createUser, generateLink });
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(createUser).toHaveBeenCalledWith({ email: "ada@example.com", email_confirm: true });
    expect(generateLink).toHaveBeenCalledWith({ type: "magiclink", email: "ada@example.com" });
    expect(m.verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "h1" });
  });

  test("hesabı olan üyede createUser çağrılmaz", async () => {
    const createUser = vi.fn();
    setup({ profile: { id: "u1", role: "uye" }, createUser });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(200);
    expect(createUser).not.toHaveBeenCalled();
  });

  test("createUser 'zaten kayıtlı' derse (yarış) devam eder", async () => {
    const createUser = vi.fn(async () => ({ data: null, error: { message: "User already registered" } }));
    setup({ profile: null, createUser });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(200);
  });

  test("generateLink veya verifyOtp hatası 500, oturum yok", async () => {
    setup({ profile: { id: "u1", role: "uye" }, generateLink: async () => ({ data: null, error: { message: "x" } }) });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(500);

    setup({ profile: { id: "u1", role: "uye" } });
    m.verifyOtp.mockResolvedValue({ error: { message: "x" } });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(500);
  });

  test("admin e-posta aramasında bulunmasa bile id ile bulunursa 401, oturum açılmaz", async () => {
    setup({ profile: null, profileById: { role: "admin" } });
    const res = await POST(req({ studentNo: "1234", token: "t" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe(GENERIC);
    expect(m.verifyOtp).not.toHaveBeenCalled();

    setup({ profile: { id: "u1", role: "uye" }, profileById: { role: "admin" } });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(401);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("id ile profil bulunamazsa 401, oturum açılmaz", async () => {
    setup({ profile: { id: "u1", role: "uye" }, profileById: null });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(401);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("generateLink kullanıcı döndürmezse 500, oturum açılmaz", async () => {
    setup({
      profile: { id: "u1", role: "uye" },
      generateLink: async () => ({ data: { properties: { hashed_token: "h1" } }, error: null }),
    });
    expect((await POST(req({ studentNo: "1234", token: "t" }))).status).toBe(500);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("farklı Origin 403, deneme sayılmaz ve oturum açılmaz", async () => {
    const inserts: unknown[] = [];
    setup({ inserts });
    const res = await POST(req({ studentNo: "1234", token: "t" }, { ...SAME_ORIGIN, origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(inserts).toHaveLength(0);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("Origin yoksa 403, deneme sayılmaz ve oturum açılmaz", async () => {
    const inserts: unknown[] = [];
    setup({ inserts });
    const res = await POST(req({ studentNo: "1234", token: "t" }, { host: "localhost", "content-type": "application/json" }));
    expect(res.status).toBe(403);
    expect(inserts).toHaveLength(0);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("JSON olmayan content-type 415, deneme sayılmaz ve oturum açılmaz", async () => {
    const inserts: unknown[] = [];
    setup({ inserts });
    const res = await POST(req({ studentNo: "1234", token: "t" }, { ...SAME_ORIGIN, "content-type": "text/plain" }));
    expect(res.status).toBe(415);
    expect(inserts).toHaveLength(0);
    expect(m.verifyOtp).not.toHaveBeenCalled();
  });

  test("hata yanıtlarında e-posta sızmaz", async () => {
    setup({ allow: { email: "kaptan@example.com", role: "admin" } });
    const text = await (await POST(req({ studentNo: "1234", token: "t" }))).text();
    expect(text).not.toContain("kaptan@example.com");
  });
});
