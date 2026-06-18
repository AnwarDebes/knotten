import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind classes so the last wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-foreground", "text-muted-foreground")).toBe("text-muted-foreground");
  });

  it("supports conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
