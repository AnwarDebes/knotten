import { getTranslations } from "next-intl/server";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { NAV_ITEMS, PRIMARY_NAV } from "@/components/site/nav-items";

/**
 * Localised site header, rendered on the server. The mobile menu is a native
 * <details> disclosure (zero client JavaScript, keyboard accessible), which
 * keeps content pages within the performance budget.
 */
async function SiteHeader() {
  const t = await getTranslations("nav");
  const ls = await getTranslations("localeSwitcher");
  const labels = { label: ls("label"), no: ls("no"), en: ls("en") };

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav aria-label={t("brand")} className="hidden items-center gap-6 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-foreground hover:text-sea text-sm font-medium transition-colors"
            >
              {t(item.key)}
            </Link>
          ))}
          <LocaleSwitcher labels={labels} />
          <Button asChild size="sm">
            <Link href="/meld-interesse">{t("meldInteresse")}</Link>
          </Button>
        </nav>

        <details className="lg:hidden">
          <summary
            aria-label={t("openMenu")}
            className="border-input bg-background hover:bg-accent focus-visible:ring-ring inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-5" />
          </summary>
          <div className="bg-background absolute top-full right-0 left-0 border-t shadow-sm">
            <nav
              aria-label={t("brand")}
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2 text-sm font-medium"
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="px-2 py-2">
                <LocaleSwitcher labels={labels} />
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href="/meld-interesse">{t("meldInteresse")}</Link>
              </Button>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

export { SiteHeader };
