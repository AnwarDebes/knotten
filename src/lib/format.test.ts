import { describe, expect, it } from "vitest";
import { formatKwh, formatNOK, formatNumber, formatPercent } from "./format";

// Norwegian grouping uses a non-breaking space; normalise whitespace so the
// assertions are stable across ICU versions.
const norm = (value: string) => value.replace(/[  \s]/g, " ");

describe("formatNumber", () => {
  it("groups thousands the Norwegian way", () => {
    expect(norm(formatNumber(14700))).toBe("14 700");
    expect(norm(formatNumber(1234567))).toBe("1 234 567");
  });

  it("uses a comma as the decimal mark", () => {
    expect(norm(formatNumber(1234.5, 1))).toBe("1 234,5");
  });
});

describe("formatNOK", () => {
  it("appends kr after a grouped amount", () => {
    expect(norm(formatNOK(1234567))).toBe("1 234 567 kr");
  });
});

describe("formatKwh", () => {
  it("appends kWh after a grouped amount", () => {
    expect(norm(formatKwh(17200))).toBe("17 200 kWh");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a whole-number percentage", () => {
    expect(norm(formatPercent(0.62))).toBe("62 %");
  });
});
