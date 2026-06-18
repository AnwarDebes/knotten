import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Meld interesse</Button>);
    expect(screen.getByRole("button", { name: "Meld interesse" })).toBeInTheDocument();
  });

  it("applies the variant and size classes", () => {
    render(
      <Button variant="sea" size="lg">
        Sjø
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Sjø" });
    expect(button.className).toContain("bg-sea");
    expect(button.className).toContain("h-11");
  });

  it("renders as a child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/kontakt">Kontakt</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Kontakt" });
    expect(link).toHaveAttribute("href", "/kontakt");
    expect(link.className).toContain("inline-flex");
  });

  it("is disabled when disabled", () => {
    render(<Button disabled>Av</Button>);
    expect(screen.getByRole("button", { name: "Av" })).toBeDisabled();
  });
});
