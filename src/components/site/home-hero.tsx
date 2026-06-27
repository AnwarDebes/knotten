import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getTerrainHero } from "@/lib/terrain-hero";

/**
 * Home hero. The artwork is the real landform of Knotten, drawn from the
 * Kartverket elevation grid as a set of true cross-sections receding from the
 * high ground to the sea-level datum. It is inline SVG plus CSS only: no client
 * JavaScript and no image request, so the headline paints immediately and the
 * route stays well inside the performance budget. Motion is a one-time draw of
 * the ridgelines; it is purely decorative, sits behind aria-hidden, and is
 * disabled under prefers-reduced-motion by the global rule in globals.css.
 */
async function HomeHero() {
  const t = await getTranslations("home");
  const cta = await getTranslations("cta");
  const terrain = getTerrainHero();
  const last = terrain.ridges.length - 1;

  return (
    <section className="hero relative isolate overflow-hidden">
      <div className="hero-art" aria-hidden="true">
        <svg
          className="h-full w-full"
          viewBox={terrain.viewBox}
          preserveAspectRatio="xMidYMax slice"
          role="presentation"
        >
          {/* Real elevation transects: silhouettes for depth, crest lines for
              light. The landform is the subject, so the lines carry real weight.
              Only the front ridges draw in on load to keep paint cost down. */}
          {terrain.ridges.map((r, i) => (
            <path key={`a-${i}`} d={r.area} fill="#091e25" fillOpacity={0.16 + r.depth * 0.5} />
          ))}
          {terrain.ridges.map((r, i) => {
            const animate = i >= last - 7;
            return (
              <path
                key={`c-${i}`}
                className={animate ? "hero-crest" : undefined}
                d={r.crest}
                pathLength={1}
                fill="none"
                stroke="#bcd7d6"
                strokeOpacity={0.22 + r.depth * 0.6}
                strokeWidth={0.8 + r.depth * 1.05}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={animate ? { animationDelay: `${360 + (last - i) * 60}ms` } : undefined}
              />
            );
          })}

          {/* The signature: the sea-level datum and a single Rødberg tick. */}
          <line
            x1="0"
            y1={terrain.datumY}
            x2={terrain.width}
            y2={terrain.datumY}
            stroke="#9fc2c4"
            strokeOpacity="0.8"
            strokeWidth="1.1"
          />
          <line
            x1="64"
            y1={terrain.datumY - 13}
            x2="64"
            y2={terrain.datumY + 13}
            stroke="#c2674a"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="hero-grad" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pt-20 pb-12 md:min-h-[86svh] md:pt-32 md:pb-16">
        <div className="hero-copy max-w-3xl">
          <p className="hero-rise hero-kicker">
            <span className="hero-kicker-mark" aria-hidden="true" />
            {t("heroKicker")}
          </p>

          <h1 className="hero-title font-display">
            {t("heroTitle")} <span className="hero-title-em italic">{t("heroTitleEmphasis")}</span>
          </h1>

          <p className="hero-rise hero-lead">{t("lead")}</p>

          <div className="hero-rise hero-actions">
            <Button asChild size="lg" variant="rodberg">
              <Link href="/meld-interesse">{cta("button")}</Link>
            </Button>
            <Link href="/omradet" className="hero-secondary">
              {t("heroCtaSecondary")}
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="hero-rise hero-base">
          <span className="hero-datum tabular-nums">
            0&nbsp;m <span className="hero-datum-sep">&middot;</span> Sniksfjorden
          </span>
          <span className="hero-credit">{t("heroCredit")}</span>
        </div>
      </div>
    </section>
  );
}

export { HomeHero };
