import { describe, it, expect } from "vitest";
import { detectLang } from "@/lib/videos/lang";

describe("detectLang", () => {
  it("Türkçe metni tr olarak sezer", () => {
    expect(detectLang("Ardupilot ile PID ayarı nasıl yapılır")).toBe("tr");
  });
  it("İngilizce metni en olarak sezer", () => {
    expect(detectLang("How to tune a PID controller for a quadcopter")).toBe("en");
  });
  it("Latin dışı yazımı other olarak işaretler", () => {
    expect(detectLang("クアッドコプターの作り方")).toBe("other");
    expect(detectLang("Как настроить полётный контроллер")).toBe("other");
  });
});
