import { describe, it, expect } from "vitest";
import { taskReviewMessage, passiveNudgeMessage } from "@/lib/notifications/message";

describe("taskReviewMessage", () => {
  it("onay mesajı", () => {
    expect(taskReviewMessage("onay", "Lehimleme")).toBe('"Lehimleme" görevin onaylandı.');
  });
  it("red mesajı", () => {
    expect(taskReviewMessage("red", "Lehimleme")).toBe('"Lehimleme" görevin reddedildi.');
  });
});

describe("passiveNudgeMessage", () => {
  it("sabit hatırlatma metni döner", () => {
    expect(passiveNudgeMessage()).toBe(
      "Bir süredir akademiye uğramadın — kaldığın yerden devam edebilirsin.",
    );
  });
});
