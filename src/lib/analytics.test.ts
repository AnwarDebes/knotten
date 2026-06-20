// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { trackGoal, GOALS } from "./analytics";

afterEach(() => {
  delete window.plausible;
});

describe("trackGoal", () => {
  it("does nothing when the analytics script is not loaded", () => {
    expect(() => trackGoal(GOALS.interestComplete)).not.toThrow();
  });

  it("forwards the goal name to plausible", () => {
    const spy = vi.fn();
    window.plausible = spy;
    trackGoal(GOALS.interestComplete);
    expect(spy).toHaveBeenCalledWith(GOALS.interestComplete, undefined);
  });

  it("passes non-identifying properties through", () => {
    const spy = vi.fn();
    window.plausible = spy;
    trackGoal(GOALS.toolUse, { tool: "energi" });
    expect(spy).toHaveBeenCalledWith(GOALS.toolUse, { props: { tool: "energi" } });
  });

  it("exposes stable goal names", () => {
    expect(GOALS.interestComplete).toBe("Interesse fullfort");
    expect(GOALS.prospektDownload).toBe("Prospekt nedlasting");
    expect(GOALS.toolUse).toBe("Verktoy brukt");
  });
});
