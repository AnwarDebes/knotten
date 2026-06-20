"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { computeExposure, bestScheme, type HomeProfile, type Scheme } from "@/lib/price-resilience";
import { formatNOK, formatPercent } from "@/lib/format";
import { trackGoal, GOALS } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/primitives/disclaimer";

type PeriodMeta = {
  key: string;
  labelNo: string;
  labelEn: string;
  start: string;
  days: number;
  avg: number;
  min: number;
  max: number;
};
type PeriodData = { key: string; hours: { t: string; p: number }[] };
type Household = "small" | "medium" | "large";

// Indicative annual demand (kWh). The energy-smart home is passivhus with a heat
// pump; the grid-dependent home is a typical electric-heated detached house.
const SMART_ANNUAL: Record<Household, number> = { small: 7000, medium: 9500, large: 12000 };
const GRID_ANNUAL: Record<Household, number> = { small: 15000, medium: 19000, large: 24000 };
const BATTERY_KWH = 10;

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

function barColor(p: number): string {
  if (p >= 2) return "var(--destructive)";
  if (p >= 0.9) return "var(--warning)";
  return "var(--success)";
}

function PriceStrip({ prices, max }: { prices: number[]; max: number }) {
  const n = prices.length;
  return (
    <svg
      viewBox={`0 0 ${n} 100`}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
      className="h-24 w-full"
    >
      {prices.map((p, i) => {
        const h = max > 0 ? Math.max(0.5, (p / max) * 100) : 0;
        return <rect key={i} x={i} y={100 - h} width={1.05} height={h} fill={barColor(p)} />;
      })}
    </svg>
  );
}

export function PriceResilienceTool() {
  const t = useTranslations("stromtrygghet");
  const locale = useLocale();
  const en = locale === "en";

  const [periods, setPeriods] = useState<PeriodMeta[] | null>(null);
  const [periodKey, setPeriodKey] = useState<string>("");
  const [data, setData] = useState<PeriodData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [household, setHousehold] = useState<Household>("medium");
  const [solarShare, setSolarShare] = useState(0.4);
  const [battery, setBattery] = useState(true);
  const tracked = useRef(false);

  const touch = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "stromtrygghet" });
    }
  };

  useEffect(() => {
    let ok = true;
    fetch("/data/no2/index.json")
      .then((r) => r.json())
      .then((idx: PeriodMeta[]) => {
        if (!ok) return;
        setPeriods(idx);
        setPeriodKey(idx[0]?.key ?? "");
      })
      .catch(() => ok && setStatus("error"));
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    if (!periodKey) return;
    let ok = true;
    fetch(`/data/no2/${periodKey}.json`)
      .then((r) => r.json())
      .then((d: PeriodData) => {
        if (ok) {
          setData(d);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (ok) setStatus("error");
      });
    return () => {
      ok = false;
    };
  }, [periodKey]);

  const model = useMemo(() => {
    if (!data) return null;
    const prices = data.hours.map((h) => h.p);
    const factor = prices.length / 8760;
    const smartHome: HomeProfile = {
      periodDemandKwh: SMART_ANNUAL[household] * factor,
      selfCoverShare: solarShare,
      batteryKwh: battery ? BATTERY_KWH : 0,
    };
    const gridHome: HomeProfile = {
      periodDemandKwh: GRID_ANNUAL[household] * factor,
      selfCoverShare: 0,
      batteryKwh: 0,
    };
    const smart = computeExposure(prices, smartHome);
    const grid = computeExposure(prices, gridHome);
    const smartScheme = bestScheme(smart);
    const gridScheme = bestScheme(grid);
    const smartCost = smart.cost[smartScheme];
    const gridCost = grid.cost[gridScheme];
    const max = Math.max(...prices);
    return {
      prices,
      max,
      smart,
      grid,
      smartScheme,
      gridScheme,
      smartCost,
      gridCost,
      reduction: gridCost > 0 ? 1 - smartCost / gridCost : 0,
    };
  }, [data, household, solarShare, battery]);

  const schemeLabel = (s: Scheme) =>
    s === "norgespris" ? t("schemeNorgespris") : t("schemeStotte");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h2 className="text-foreground text-lg font-semibold">{t("inputsHeading")}</h2>

        <div className="space-y-2">
          <Label htmlFor="period">{t("period")}</Label>
          <select
            id="period"
            className={selectClass}
            value={periodKey}
            onChange={(e) => {
              touch();
              setStatus("loading");
              setPeriodKey(e.target.value);
            }}
          >
            {(periods ?? []).map((p) => (
              <option key={p.key} value={p.key}>
                {en ? p.labelEn : p.labelNo}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="household">{t("household")}</Label>
          <select
            id="household"
            className={selectClass}
            value={household}
            onChange={(e) => {
              touch();
              setHousehold(e.target.value as Household);
            }}
          >
            <option value="small">{t("householdOptions.small")}</option>
            <option value="medium">{t("householdOptions.medium")}</option>
            <option value="large">{t("householdOptions.large")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="solar">
            {t("solar")}:{" "}
            <span className="text-muted-foreground font-normal">{formatPercent(solarShare)}</span>
          </Label>
          <input
            id="solar"
            type="range"
            min={0}
            max={0.6}
            step={0.05}
            value={solarShare}
            className="accent-sea w-full"
            onChange={(e) => {
              touch();
              setSolarShare(Number(e.target.value));
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="battery"
            type="checkbox"
            checked={battery}
            className="border-input accent-sea size-5 rounded"
            onChange={(e) => {
              touch();
              setBattery(e.target.checked);
            }}
          />
          <Label htmlFor="battery" className="font-normal">
            {t("battery")}
          </Label>
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-foreground text-lg font-semibold">{t("resultsHeading")}</h2>

        {status === "loading" ? (
          <p className="text-muted-foreground text-sm" role="status">
            {t("loading")}
          </p>
        ) : status === "error" || !model ? (
          <p className="text-muted-foreground text-sm" role="status">
            {t("error")}
          </p>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">{t("selfCovered")}</p>
                <p className="text-foreground mt-1 text-2xl font-semibold tracking-tight">
                  {formatPercent(model.smart.selfCoveredShare)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-muted-foreground text-sm">{t("exposureHeading")}</p>
                <ExposureBar
                  label={t("gridDependent")}
                  value={model.gridCost}
                  max={model.gridCost}
                  color="var(--destructive)"
                />
                <ExposureBar
                  label={t("energySmart")}
                  value={model.smartCost}
                  max={model.gridCost}
                  color="var(--success)"
                />
                <p className="text-foreground text-sm">
                  {t("reduction", { pct: formatPercent(model.reduction) })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="text-muted-foreground text-sm">{t("priceStripHeading")}</p>
                <PriceStrip prices={model.prices} max={model.max} />
                <p className="text-muted-foreground text-xs">{t("priceStripNote")}</p>
              </CardContent>
            </Card>

            <p className="text-muted-foreground text-sm">
              {t("schemeNote", { scheme: schemeLabel(model.smartScheme) })}
            </p>

            <details className="text-sm">
              <summary className="text-sea cursor-pointer">{t("tableToggle")}</summary>
              <table className="mt-3 w-full text-left">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-4 font-medium">{t("tableCol")}</th>
                    <th className="py-1 pr-4 font-medium">{t("gridDependent")}</th>
                    <th className="py-1 font-medium">{t("energySmart")}</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr>
                    <td className="py-1 pr-4">{t("rowCost")}</td>
                    <td className="py-1 pr-4">{formatNOK(model.gridCost)}</td>
                    <td className="py-1">{formatNOK(model.smartCost)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">{t("rowSpike")}</td>
                    <td className="py-1 pr-4">
                      {formatNOK(model.grid.spikeCost[model.gridScheme])}
                    </td>
                    <td className="py-1">{formatNOK(model.smart.spikeCost[model.smartScheme])}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">{t("rowGridDraw")}</td>
                    <td className="py-1 pr-4">{Math.round(model.grid.gridDrawKwh)} kWh</td>
                    <td className="py-1">{Math.round(model.smart.gridDrawKwh)} kWh</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </>
        )}

        <div className="border-border space-y-2 border-t pt-4">
          <h3 className="text-foreground text-sm font-semibold">{t("assumptionsHeading")}</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
            {(t.raw("assumptions") as string[]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">{t("source")}</p>
          <Disclaimer>{t("disclaimer")}</Disclaimer>
        </div>
      </div>
    </div>
  );
}

function ExposureBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div>
      <div className="text-foreground mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{formatNOK(value)}</span>
      </div>
      <div className="bg-secondary h-3 w-full overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
