import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EnergyIcon } from "./energy-icon";

const ids = ["sol", "vind", "bergvarme", "batteri", "delt-base", "hub", "v2g", "robusthet"];

describe("EnergyIcon", () => {
  it("renders an aria-hidden svg for every energy element id", () => {
    for (const id of ids) {
      const { container } = render(<EnergyIcon id={id} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("falls back to a default illustration for an unknown id", () => {
    const { container } = render(<EnergyIcon id="ukjent" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
