import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

type NavItem = { href: string; label: string };

const defaultNav: NavItem[] = [
  { href: "#", label: "Visjon" },
  { href: "#", label: "Energikonseptet" },
  { href: "#", label: "Tomtene" },
  { href: "#", label: "Verktøy" },
  { href: "#", label: "Kontakt" },
];

/**
 * Responsive site header, rendered entirely on the server with no client
 * JavaScript: the mobile menu is a native <details> disclosure (keyboard
 * accessible, announces its expanded state). Links are placeholders until the
 * marketing IA lands in SPEC-02. Keeping this zero-JS holds content pages at
 * the performance budget.
 */
function SiteHeader({ nav = defaultNav }: { nav?: NavItem[] }) {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="#"
          className="focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav aria-label="Hovedmeny" className="hidden items-center gap-6 lg:flex">
          {nav.map((item, i) => (
            <Link
              key={`${item.label}-${i}`}
              href={item.href}
              className="text-foreground hover:text-sea text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="#">Meld interesse</Link>
          </Button>
        </nav>

        <details className="lg:hidden">
          <summary
            aria-label="Åpne meny"
            className="border-input bg-background hover:bg-accent focus-visible:ring-ring inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-5" />
          </summary>
          <div className="bg-background absolute top-full right-0 left-0 border-t shadow-sm">
            <nav
              aria-label="Mobilmeny"
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4"
            >
              {nav.map((item, i) => (
                <Link
                  key={`m-${item.label}-${i}`}
                  href={item.href}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2 text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-2 w-full">
                <Link href="#">Meld interesse</Link>
              </Button>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

export { SiteHeader };
