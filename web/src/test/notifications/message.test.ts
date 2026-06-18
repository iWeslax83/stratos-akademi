import { describe, it, expect } from "vitest";
import { taskReviewMessage } from "@/lib/notifications/message";

describe("taskReviewMessage", () => {
  it("onay mesajı", () => {
    expect(taskReviewMessage("onay", "Lehimleme")).toBe('"Lehimleme" görevin onaylandı.');
  });
  it("red mesajı", () => {
    expect(taskReviewMessage("red", "Lehimleme")).toBe('"Lehimleme" görevin reddedildi.');
  });
});
