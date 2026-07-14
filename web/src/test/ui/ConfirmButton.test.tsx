import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

// useServerAction içindeki router.refresh() testte gerçek router istemesin.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("ConfirmButton", () => {
  it("ilk tıklama silmez, önce sorar", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true });
    render(<ConfirmButton onConfirm={onConfirm} soru="Ders silinsin mi?" />);

    await userEvent.click(screen.getByRole("button", { name: "Sil" }));

    expect(screen.getByText("Ders silinsin mi?")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("onaylanınca işlemi çalıştırır", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true });
    render(<ConfirmButton onConfirm={onConfirm} soru="Ders silinsin mi?" />);

    await userEvent.click(screen.getByRole("button", { name: "Sil" }));
    await userEvent.click(screen.getByRole("button", { name: "Evet, sil" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("vazgeçince soru kapanır ve işlem çalışmaz", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true });
    render(<ConfirmButton onConfirm={onConfirm} soru="Ders silinsin mi?" />);

    await userEvent.click(screen.getByRole("button", { name: "Sil" }));
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByText("Ders silinsin mi?")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sil" })).toBeInTheDocument();
  });

  it("başarısız işlemde hatayı satır içinde gösterir", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, error: "Yetkin yok" });
    render(<ConfirmButton onConfirm={onConfirm} soru="Ders silinsin mi?" />);

    await userEvent.click(screen.getByRole("button", { name: "Sil" }));
    await userEvent.click(screen.getByRole("button", { name: "Evet, sil" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Yetkin yok");
  });
});
