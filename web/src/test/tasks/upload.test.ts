import { describe, it, expect } from "vitest";
import { validateFile, uploadPath, MAX_FILE_BYTES } from "@/lib/tasks/upload";

describe("validateFile", () => {
  it("izinli tipler null döner", () => {
    expect(validateFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateFile({ type: "application/pdf", size: 1000 })).toBeNull();
  });
  it("yanlış tip hata", () => {
    expect(validateFile({ type: "text/plain", size: 10 })).toMatch(/JPG|PNG|WEBP|PDF/);
  });
  it("büyük boyut hata", () => {
    expect(validateFile({ type: "image/png", size: MAX_FILE_BYTES + 1 })).toMatch(/5MB/);
  });
});

describe("uploadPath", () => {
  it("yapı: userId/taskId/stamp-ad", () => {
    expect(uploadPath("u1", "t1", "foto.png", 123)).toBe("u1/t1/123-foto.png");
  });
  it("güvensiz karakterleri sadeleştirir", () => {
    expect(uploadPath("u1", "t1", "a b/c?.png", 9)).toBe("u1/t1/9-a_b_c_.png");
  });
});
