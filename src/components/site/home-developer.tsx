import { getTranslations } from "next-intl/server";
import { SectionHead, ArrowLink } from "@/components/site/primitives";

/**
 * The developer, stated plainly. Credibility comes from restraint here: who is
 * building this, how they talk about it, and a direct line to them.
 */
async function HomeDeveloper() {
  const t = await getTranslations("home.developer");

  return (
    <section className="border-border/70 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-x-16 gap-y-10 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("body")} elevation={176} />

        <div className="border-border/70 lg:border-l lg:pl-12">
          <p className="font-display text-foreground text-xl tracking-tight">{t("contactName")}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t("contactRole")}</p>
          <div className="mt-5 space-y-1.5 text-sm">
            <a href="tel:+4795495152" className="text-foreground hover:text-sea block">
              +47 954 95 152
            </a>
            <a
              href="mailto:sigve.simonsen@hotmail.com"
              className="text-foreground hover:text-sea block break-all"
            >
              sigve.simonsen@hotmail.com
            </a>
          </div>
          <div className="mt-7">
            <ArrowLink href="/kontakt">{t("cta")}</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export { HomeDeveloper };
