import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/site/primitives";
import { getTerrainProfile } from "@/lib/terrain-hero";

type Fact = { label: string; value: string; note: string };

/**
 * The setting. A sense-of-place paragraph and a measured fact ledger, closed by
 * a true sea-to-summit cross-section drawn from the Kartverket elevation model,
 * so the place is shown honestly rather than dressed up.
 */
async function HomePlace() {
  const t = await getTranslations("home.place");
  const facts = t.raw("facts") as Fact[];
  const profile = getTerrainProfile();

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl">
          <Eyebrow elevation={12}>{t("eyebrow")}</Eyebrow>
          <h2 className="font-display text-foreground mt-5 text-[clamp(1.9rem,3.4vw,2.85rem)] leading-[1.08] font-normal tracking-[-0.018em] text-balance">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">{t("body")}</p>
        </div>

        <div className="lg:pt-2">
          <h3 className="text-foreground text-sm font-medium tracking-[0.16em] uppercase">
            {t("factsHeading")}
          </h3>
          <dl className="mt-4">
            {facts.map((f, i) => (
              <div
                key={i}
                className="border-border/70 grid grid-cols-1 gap-x-4 gap-y-1 border-t py-4 sm:grid-cols-[7rem_1fr]"
              >
                <dt className="text-muted-foreground text-sm">{f.label}</dt>
                <dd className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <span className="text-foreground font-display text-2xl tracking-tight tabular-nums">
                    {f.value}
                  </span>
                  <span className="text-muted-foreground text-sm sm:text-right">{f.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <figure className="mt-16">
        <svg
          className="h-36 w-full md:h-48"
          viewBox={profile.viewBox}
          preserveAspectRatio="xMidYMax meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="profile-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0c5560" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0c5560" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={profile.area} fill="url(#profile-fill)" />
          <path
            d={profile.path}
            fill="none"
            stroke="#12333c"
            strokeOpacity="0.85"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1={profile.baseY}
            x2={profile.width}
            y2={profile.baseY}
            stroke="#0c5560"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
          <line
            x1="2"
            y1={profile.baseY - 9}
            x2="2"
            y2={profile.baseY + 9}
            stroke="#9e4a2c"
            strokeWidth="2.4"
          />
        </svg>
        <figcaption className="text-muted-foreground mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-xs">
          <span className="tabular-nums">
            0 m <span className="text-rodberg px-1">·</span> Sniksfjorden
            <span className="px-2 opacity-30">/</span>
            {profile.peak} m peak
          </span>
          <span className="max-w-md text-right">{t("profileCaption")}</span>
        </figcaption>
      </figure>
    </section>
  );
}

export { HomePlace };
