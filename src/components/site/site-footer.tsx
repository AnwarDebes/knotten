import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/site/logo";
import { FOOTER_FORDEG, FOOTER_OMRADET } from "@/components/site/nav-items";

/** Localised site footer, server rendered. */
async function SiteFooter() {
  const nav = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer className="bg-muted/40 mt-16 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground text-sm">{t("tagline")}</p>
        </div>

        <nav aria-label={t("colOmradet")} className="space-y-2 text-sm">
          <p className="text-foreground font-medium">{t("colOmradet")}</p>
          <ul className="text-muted-foreground space-y-1">
            {FOOTER_OMRADET.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="hover:text-foreground">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("colForDeg")} className="space-y-2 text-sm">
          <p className="text-foreground font-medium">{t("colForDeg")}</p>
          <ul className="text-muted-foreground space-y-1">
            {FOOTER_FORDEG.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="hover:text-foreground">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 text-sm">
          <p className="text-foreground font-medium">{t("colKontakt")}</p>
          <p className="text-muted-foreground">
            Sigve Simonsen
            <br />
            Daglig leder
            <br />
            <a href="tel:+4795495152" className="hover:text-foreground">
              +47 954 95 152
            </a>
            <br />
            <a href="mailto:sigve.simonsen@hotmail.com" className="hover:text-foreground">
              sigve.simonsen@hotmail.com
            </a>
          </p>
          <Link href="/personvern" className="text-sea hover:underline">
            {t("personvern")}
          </Link>
        </div>
      </div>
      <div className="border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-6xl px-6 py-4 text-xs">
          {t("legal")}
        </p>
      </div>
    </footer>
  );
}

export { SiteFooter };
