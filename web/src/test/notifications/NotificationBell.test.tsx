import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: (...a: unknown[]) => push(...a) }),
}));

vi.mock("@/app/actions/notifications", () => ({
  listNotifications: vi.fn(async () => [
    { id: "n1", mesaj: "Görevin onaylandı", link: "/gorevler", okundu: false, created_at: "2026-07-13" },
    { id: "n2", mesaj: "Eski bildirim", link: null, okundu: true, created_at: "2026-07-12" },
  ]),
  markRead: vi.fn(async () => ({ ok: true })),
  markAllRead: vi.fn(async () => ({ ok: true })),
}));

describe("NotificationBell", () => {
  it("zile tıklayınca bildirimleri panelde gösterir, sayfaya gitmez", async () => {
    render(<NotificationBell unread={1} />);
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /bildirimler/i }));

    const panel = await screen.findByRole("dialog", { name: "Bildirimler" });
    expect(panel).toBeInTheDocument();
    expect(await screen.findByText("Görevin onaylandı")).toBeInTheDocument();
    // Panel açmak yönlendirme yapmamalı.
    expect(push).not.toHaveBeenCalled();
  });

  it("Escape paneli kapatır", async () => {
    render(<NotificationBell unread={0} />);
    await userEvent.click(screen.getByRole("button", { name: /bildirimler/i }));
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("okunmamış sayısını rozette gösterir", () => {
    render(<NotificationBell unread={3} />);
    expect(screen.getByRole("button", { name: /3 okunmamış/i })).toBeInTheDocument();
  });
});
