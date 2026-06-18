import Link from "next/link";
import { Logo } from "@/components/site/logo";

/**
 * Site footer. Links are placeholders until the marketing IA lands in SPEC-02.
 */
function SiteFooter() {
  return (
    <footer className="bg-muted/40 mt-16 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground text-sm">
            Et energismart boligområde ved sjøen i Rødberg, Sniksfjorden, Lindesnes kommune.
          </p>
        </div>
        <nav aria-label="Området" className="space-y-2 text-sm">
          <p className="text-foreground font-medium">Området</p>
          <ul className="text-muted-foreground space-y-1">
            <li>
              <Link href="#" className="hover:text-foreground">
                Visjon
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                Energikonseptet
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                Tomtene
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="For deg" className="space-y-2 text-sm">
          <p className="text-foreground font-medium">For deg</p>
          <ul className="text-muted-foreground space-y-1">
            <li>
              <Link href="#" className="hover:text-foreground">
                Verktøy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                Meld interesse
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                Kontakt
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="text-foreground font-medium">Sigve Simonsen AS</p>
          <p className="text-muted-foreground">
            Sigve Simonsen
            <br />
            Daglig leder
          </p>
          <Link href="#" className="text-sea hover:underline">
            Personvern
          </Link>
        </div>
      </div>
      <div className="border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-6xl px-6 py-4 text-xs">
          Sigve Simonsen AS. Illustrasjoner og tall er foreløpige og kan endres.
        </p>
      </div>
    </footer>
  );
}

export { SiteFooter };
