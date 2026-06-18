import { describe, it, expect } from "vitest";
import { taskReviewEmail } from "@/lib/email/templates";

describe("taskReviewEmail", () => {
  it("onay: konu başlığı içerir, html link + başlık içerir", () => {
    const { subject, html } = taskReviewEmail("onay", "Lehimleme", "https://x/gorev/1");
    expect(subject).toContain("onaylandı");
    expect(subject).toContain("Lehimleme");
    expect(html).toContain("https://x/gorev/1");
    expect(html).toContain("Lehimleme");
  });
  it("red: konu reddedildi içerir", () => {
    const { subject } = taskReviewEmail("red", "QGC", "https://x/gorev/1");
    expect(subject).toContain("reddedildi");
    expect(subject).toContain("QGC");
  });
});
