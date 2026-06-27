import { describe, it, expect } from "vitest";
import { isNewMember, welcomeHeading } from "@/lib/dashboard/onboarding";

describe("isNewMember", () => {
  it("hiç ilerleme yoksa yeni üye", () => {
    expect(isNewMember({ completed: 0, activity: 0, approvedTasks: 0 })).toBe(true);
  });

  it("tamamlanan ders varsa yeni değil", () => {
    expect(isNewMember({ completed: 1, activity: 0, approvedTasks: 0 })).toBe(false);
  });

  it("aktivite (quiz denemesi) varsa yeni değil", () => {
    expect(isNewMember({ completed: 0, activity: 2, approvedTasks: 0 })).toBe(false);
  });

  it("onaylı görev varsa yeni değil", () => {
    expect(isNewMember({ completed: 0, activity: 0, approvedTasks: 1 })).toBe(false);
  });
});

describe("welcomeHeading", () => {
  it("yeni üyeye Hoş geldin", () => {
    expect(welcomeHeading("Ayşe", true)).toBe("Hoş geldin, Ayşe");
  });

  it("dönen üyeye Tekrar hoş geldin", () => {
    expect(welcomeHeading("Ayşe", false)).toBe("Tekrar hoş geldin, Ayşe");
  });
});
