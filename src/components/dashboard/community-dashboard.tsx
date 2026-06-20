import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardParams } from "@/lib/content/public";
import { SimulatedSource } from "@/lib/energy-telemetry";

/**
 * Community energy dashboard: four calm tiles showing the development behaving
 * as one energy community. Every value is a deterministic, admin-tunable
 * simulation and is labelled an illustrative simulation, never live telemetry.
 * Server-rendered so it works with no JavaScript; the only motion is a
 * reduced-motion-safe pulse.
 */
export async function CommunityDashboard() {
  const t = await getTranslations("communityDashboard");
  const params = await getDashboardParams();
  const source = new SimulatedSource(params);
  const now = new Date();

  const production = source.productionTodayKwh(now);
  const soc = Math.round(source.batterySoc(now) * 100);
  const selfSuff = Math.round(source.communitySelfSufficiency() * 100);
  const outage = source.outageEvent();

  return (
    <section aria-label={t("title")} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">{t("title")}</h2>
        <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
          {t("simBadge")}
        </span>
      </div>
      <p className="text-muted-foreground max-w-prose text-sm">{t("intro")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t("solarLabel")} sim={t("simBadge")}>
          <SunMark />
          <Value value={`${production.toLocaleString("nb-NO")} kWh`} caption={t("solarCaption")} />
        </Tile>

        <Tile label={t("batteryLabel")} sim={t("simBadge")}>
          <BatteryMark soc={soc} />
          <Value value={`${soc} %`} caption={t("batteryCaption")} />
        </Tile>

        <Tile label={t("selfLabel")} sim={t("simBadge")}>
          <Ring percent={selfSuff} />
          <Value value={`${selfSuff} %`} caption={t("selfCaption")} />
        </Tile>

        <Tile label={t("outageLabel")} sim={t("simBadge")}>
          <ShieldMark />
          <Value
            value={t("outageValue", { homes: outage.homesPowered, hours: outage.durationHours })}
            caption={t("outageCaption")}
          />
        </Tile>
      </div>

      <p className="text-muted-foreground text-xs">{t("sources")}</p>
    </section>
  );
}

function Tile({ label, sim, children }: { label: string; sim: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-3">{children}</div>
        <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{sim}</p>
      </CardContent>
    </Card>
  );
}

function Value({ value, caption }: { value: string; caption: string }) {
  return (
    <div>
      <p className="text-foreground text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground text-xs">{caption}</p>
    </div>
  );
}

function SunMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-10 shrink-0" role="img" aria-hidden>
      <g className="motion-safe:animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={24 + Math.cos(a) * 14}
              y1={24 + Math.sin(a) * 14}
              x2={24 + Math.cos(a) * 20}
              y2={24 + Math.sin(a) * 20}
              stroke="var(--warning)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle cx={24} cy={24} r={9} fill="var(--warning)" />
    </svg>
  );
}

function BatteryMark({ soc }: { soc: number }) {
  return (
    <svg viewBox="0 0 48 48" className="size-10 shrink-0" role="img" aria-hidden>
      <rect
        x={10}
        y={16}
        width={26}
        height={16}
        rx={3}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={2}
      />
      <rect x={36} y={21} width={3} height={6} rx={1} fill="var(--foreground)" />
      <rect
        x={12}
        y={18}
        width={(22 * Math.min(100, Math.max(0, soc))) / 100}
        height={12}
        rx={1}
        fill="var(--success)"
      />
    </svg>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <svg viewBox="0 0 48 48" className="size-10 shrink-0" role="img" aria-hidden>
      <circle cx={24} cy={24} r={r} fill="none" stroke="var(--secondary)" strokeWidth={5} />
      <circle
        cx={24}
        cy={24}
        r={r}
        fill="none"
        stroke="var(--sea)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-10 shrink-0" role="img" aria-hidden>
      <path
        d="M24 6 L38 12 V24 C38 33 32 39 24 42 C16 39 10 33 10 24 V12 Z"
        fill="none"
        stroke="var(--sea)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M18 24 l4 4 l8 -9"
        fill="none"
        stroke="var(--success)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
