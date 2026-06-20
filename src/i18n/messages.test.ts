import { describe, expect, it } from "vitest";
import no from "../../messages/no.json";
import en from "../../messages/en.json";

describe("message catalogues", () => {
  it("has the same top-level namespaces in both locales", () => {
    expect(Object.keys(no).sort()).toEqual(Object.keys(en).sort());
  });

  it("never uses an em dash", () => {
    const EM_DASH = "\u2014";
    const hasEmDash = (value: unknown): boolean => {
      if (typeof value === "string") return value.includes(EM_DASH);
      if (Array.isArray(value)) return value.some(hasEmDash);
      if (value && typeof value === "object") return Object.values(value).some(hasEmDash);
      return false;
    };
    expect(hasEmDash(no)).toBe(false);
    expect(hasEmDash(en)).toBe(false);
  });

  it("has eight energy elements with matching ids and valid maturity in both locales", () => {
    const valid = new Set(["proven", "emerging", "concept"]);
    const noEls = no.energikonseptet.elements;
    const enEls = en.energikonseptet.elements;
    expect(noEls).toHaveLength(8);
    expect(enEls).toHaveLength(8);
    expect(noEls.map((e) => e.id)).toEqual(enEls.map((e) => e.id));
    for (const el of [...noEls, ...enEls]) {
      expect(valid.has(el.maturity)).toBe(true);
      expect(el.title.length).toBeGreaterThan(0);
      expect(el.explainer.length).toBeGreaterThan(0);
      expect(el.herNote.length).toBeGreaterThan(0);
      expect(el.source.length).toBeGreaterThan(0);
    }
  });
});
