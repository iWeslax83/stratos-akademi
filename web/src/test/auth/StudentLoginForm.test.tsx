import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/auth/TurnstileWidget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string | null) => void }) => (
    <button type="button" onClick={() => onToken("tok")}>
      captcha-coz
    </button>
  ),
}));

const { StudentLoginForm } = await import("@/components/auth/StudentLoginForm");

const assign = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has no scrollIntoView; FormError calls it when an error appears.
  Element.prototype.scrollIntoView = vi.fn();
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  Object.defineProperty(window, "location", { value: { assign }, writable: true });
});

describe("StudentLoginForm", () => {
  test("site key yoksa form yerine kapalı mesajı gösterir", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    render(<StudentLoginForm />);
    expect(screen.getByText(/şu an kapalı/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/öğrenci numarası/i)).not.toBeInTheDocument();
  });

  test("captcha çözülmeden ve numara girilmeden buton kapalı", async () => {
    render(<StudentLoginForm />);
    const btn = screen.getByRole("button", { name: /giriş yap/i });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/öğrenci numarası/i), "1234");
    expect(btn).toBeDisabled();
    await userEvent.click(screen.getByText("captcha-coz"));
    expect(btn).toBeEnabled();
  });

  test("rakam dışı karakter alana girmez", async () => {
    render(<StudentLoginForm />);
    const input = screen.getByLabelText(/öğrenci numarası/i);
    await userEvent.type(input, "12ab34");
    expect(input).toHaveValue("1234");
  });

  test("başarıda numara ve token gönderilir, /panom'a gidilir", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StudentLoginForm />);
    await userEvent.type(screen.getByLabelText(/öğrenci numarası/i), "1234");
    await userEvent.click(screen.getByText("captcha-coz"));
    await userEvent.click(screen.getByRole("button", { name: /giriş yap/i }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/panom"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/auth/student");
    expect(JSON.parse(String(init.body))).toEqual({ studentNo: "1234", token: "tok" });
  });

  test("hatada mesaj gösterilir, yönlenmez, captcha yeniden istenir", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "Numara bulunamadı veya giriş yapılamadı." }, { status: 401 })));
    render(<StudentLoginForm />);
    await userEvent.type(screen.getByLabelText(/öğrenci numarası/i), "1234");
    await userEvent.click(screen.getByText("captcha-coz"));
    await userEvent.click(screen.getByRole("button", { name: /giriş yap/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Numara bulunamadı veya giriş yapılamadı.");
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /giriş yap/i })).toBeDisabled();
  });

  test("ağ hatasında genel mesaj", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ağ"); }));
    render(<StudentLoginForm />);
    await userEvent.type(screen.getByLabelText(/öğrenci numarası/i), "1234");
    await userEvent.click(screen.getByText("captcha-coz"));
    await userEvent.click(screen.getByRole("button", { name: /giriş yap/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/tekrar dene/i);
  });
});
