import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The repeated primary call to action plus the "what happens next" block.
 * Server rendered, no client JavaScript.
 */
async function MeldInteresseCta() {
  const t = await getTranslations("cta");
  const steps = t.raw("whatNextSteps") as { title: string; body: string }[];

  return (
    <section className="bg-secondary/50 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sea text-sm font-medium tracking-wide uppercase">{t("eyebrow")}</p>
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("heading")}
          </h2>
          <p className="text-foreground max-w-prose leading-7">{t("body")}</p>
          <Button asChild size="lg">
            <Link href="/meld-interesse">{t("button")}</Link>
          </Button>
        </div>
        <div className="space-y-4">
          <h3 className="text-foreground text-lg font-semibold">{t("whatNextHeading")}</h3>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="text-foreground block font-medium">{step.title}</span>
                  <span className="text-muted-foreground block text-sm">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export { MeldInteresseCta };
