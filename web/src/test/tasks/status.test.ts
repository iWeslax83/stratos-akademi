import { describe, it, expect } from "vitest";
import { canEditSubmission, submissionStatusLabel } from "@/lib/tasks/status";

describe("canEditSubmission", () => {
  it("gönderim yok / beklemede / red → düzenlenebilir", () => {
    expect(canEditSubmission(null)).toBe(true);
    expect(canEditSubmission("beklemede")).toBe(true);
    expect(canEditSubmission("red")).toBe(true);
  });
  it("onay → kilitli", () => {
    expect(canEditSubmission("onay")).toBe(false);
  });
});

describe("submissionStatusLabel", () => {
  it("durum etiketleri", () => {
    expect(submissionStatusLabel(null)).toBe("Gönderilmedi");
    expect(submissionStatusLabel("beklemede")).toBe("Beklemede");
    expect(submissionStatusLabel("onay")).toBe("Onaylandı");
    expect(submissionStatusLabel("red")).toBe("Reddedildi");
  });
});
