import { describe, it, expect } from "vitest";
import { cleanComment, commentNotifyTarget, groupThreads, type CommentRow } from "@/lib/tasks/comment";

describe("cleanComment", () => {
  it("baştaki/sondaki boşluğu kırpar, null güvenli", () => {
    expect(cleanComment("  selam  ")).toBe("selam");
    expect(cleanComment(null)).toBe("");
    expect(cleanComment(undefined)).toBe("");
  });
});

describe("commentNotifyTarget", () => {
  const owner = "uye-1";
  const captain = "kaptan-1";

  it("kaptan yorumladı → gönderim sahibine bildir", () => {
    expect(
      commentNotifyTarget({ authorId: captain, authorIsAdmin: true, submissionOwnerId: owner, reviewedBy: null }),
    ).toBe(owner);
  });

  it("kaptan kendi gönderimine yorum yaptı → bildirim yok", () => {
    expect(
      commentNotifyTarget({ authorId: owner, authorIsAdmin: true, submissionOwnerId: owner, reviewedBy: null }),
    ).toBeNull();
  });

  it("üye yorumladı, son inceleyen var → o kaptana bildir", () => {
    expect(
      commentNotifyTarget({ authorId: owner, authorIsAdmin: false, submissionOwnerId: owner, reviewedBy: captain }),
    ).toBe(captain);
  });

  it("üye yorumladı, henüz incelenmemiş → bildirim yok", () => {
    expect(
      commentNotifyTarget({ authorId: owner, authorIsAdmin: false, submissionOwnerId: owner, reviewedBy: null }),
    ).toBeNull();
  });

  it("üye yorumladı, son inceleyen kendisi (uç durum) → bildirim yok", () => {
    expect(
      commentNotifyTarget({ authorId: owner, authorIsAdmin: false, submissionOwnerId: owner, reviewedBy: owner }),
    ).toBeNull();
  });
});

describe("groupThreads", () => {
  const rows: CommentRow[] = [
    { id: "c2", submission_id: "s1", author_id: "kaptan", mesaj: "fotoğrafı yenile", created_at: "2026-06-25T10:00:00Z" },
    { id: "c1", submission_id: "s1", author_id: "uye", mesaj: "ilk gönderim", created_at: "2026-06-25T09:00:00Z" },
    { id: "c3", submission_id: "s2", author_id: "uye", mesaj: "başka görev", created_at: "2026-06-25T11:00:00Z" },
  ];
  const ownerById = new Map([
    ["s1", "uye"],
    ["s2", "uye"],
  ]);
  const nameById = new Map([
    ["uye", "Ali"],
    ["kaptan", "Kaptan Emir"],
  ]);

  it("submission'a göre gruplar ve created_at artan sıralar", () => {
    const map = groupThreads(rows, ownerById, nameById);
    expect(map.get("s1")!.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(map.get("s2")!.map((c) => c.id)).toEqual(["c3"]);
  });

  it("sahiplik etiketi ve ad doğru", () => {
    const map = groupThreads(rows, ownerById, nameById);
    const [first, second] = map.get("s1")!;
    expect(first).toMatchObject({ authorAd: "Ali", authorIsOwner: true });
    expect(second).toMatchObject({ authorAd: "Kaptan Emir", authorIsOwner: false });
  });

  it("bilinmeyen ad → 'Üye' fallback; bilinmeyen sahip → authorIsOwner false", () => {
    const map = groupThreads(
      [{ id: "c9", submission_id: "sX", author_id: "yok", mesaj: "x", created_at: "2026-06-25T12:00:00Z" }],
      new Map(),
      new Map(),
    );
    expect(map.get("sX")![0]).toMatchObject({ authorAd: "Üye", authorIsOwner: false });
  });
});
