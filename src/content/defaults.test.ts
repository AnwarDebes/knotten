// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_TIMELINE, DEFAULT_FAQ } from "./defaults";

describe("default timeline", () => {
  it("marks exactly one stage as current", () => {
    expect(DEFAULT_TIMELINE.filter((s) => s.isCurrent)).toHaveLength(1);
  });

  it("has bilingual labels and a phase note on every stage", () => {
    for (const s of DEFAULT_TIMELINE) {
      expect(s.labelNo.length).toBeGreaterThan(0);
      expect(s.labelEn.length).toBeGreaterThan(0);
      expect(s.dateOrStage.length).toBeGreaterThan(0);
    }
  });
});

describe("default FAQ", () => {
  it("has bilingual question and answer on every entry with unique keys", () => {
    const keys = DEFAULT_FAQ.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of DEFAULT_FAQ) {
      expect(f.questionNo.length).toBeGreaterThan(0);
      expect(f.questionEn.length).toBeGreaterThan(0);
      expect(f.answerNo.length).toBeGreaterThan(0);
      expect(f.answerEn.length).toBeGreaterThan(0);
    }
  });

  it("cites a source on the factual scheme answers", () => {
    const stotte = DEFAULT_FAQ.find((f) => f.key === "stotte")!;
    expect(stotte.answerNo.toLowerCase()).toContain("kilde");
    expect(stotte.answerEn.toLowerCase()).toContain("source");
  });
});
