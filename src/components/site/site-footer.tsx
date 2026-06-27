import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/site/logo";
import { FOOTER_FORDEG, FOOTER_OMRADET } from "@/components/site/nav-items";

/** Localised site footer, server rendered. Dark, to close the page in dusk. */
async function SiteFooter() {
  const nav = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-[rgba(190,209,205,0.14)] bg-[#0a1b22] text-[#eef3f0]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo className="text-[#eef3f0]" />
          <p className="text-sm leading-relaxed text-[rgba(195,212,208,0.78)]">{t("tagline")}</p>
        </div>

        <nav aria-label={t("colOmradet")} className="space-y-3 text-sm">
          <p className="font-medium text-[#e1eae6]">{t("colOmradet")}</p>
          <ul className="space-y-2 text-[rgba(195,212,208,0.78)]">
            {FOOTER_OMRADET.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("colForDeg")} className="space-y-3 text-sm">
          <p className="font-medium text-[#e1eae6]">{t("colForDeg")}</p>
          <ul className="space-y-2 text-[rgba(195,212,208,0.78)]">
            {FOOTER_FORDEG.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <p className="font-medium text-[#e1eae6]">{t("colKontakt")}</p>
          <p className="text-[rgba(195,212,208,0.78)]">
            Sigve Simonsen
            <br />
            Daglig leder
            <br />
            <a href="tel:+4795495152" className="transition-colors hover:text-white">
              +47 954 95 152
            </a>
            <br />
            <a
              href="mailto:sigve.simonsen@hotmail.com"
              className="break-all transition-colors hover:text-white"
            >
              sigve.simonsen@hotmail.com
            </a>
          </p>
          <Link
            href="/personvern"
            className="inline-block text-[#a4c5c6] transition-colors hover:text-white hover:underline"
          >
            {t("personvern")}
          </Link>
        </div>
      </div>
      <div className="border-t border-[rgba(190,209,205,0.12)]">
        <p className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[rgba(195,212,208,0.66)]">
          {t("legal")}
        </p>
      </div>
    </footer>
  );
}

export { SiteFooter };
