"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { computeEnergy, type Household } from "@/lib/energy";
import { computeCo2, CO2_FACTORS, DEFAULT_FACTOR, type FactorKey } from "@/lib/co2";
import { formatNumber } from "@/lib/format";
import { trackGoal, GOALS } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/primitives/disclaimer";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

const HOUSEHOLDS: Household[] = ["small", "medium", "large"];
const FACTOR_KEYS: FactorKey[] = ["norwayProduction", "nordicMix", "europeanResidual"];

export function Co2Tool() {
  const t = useTranslations("co2");
  const [household, setHousehold] = useState<Household>("medium");
  const [factorKey, setFactorKey] = useState<FactorKey>(DEFAULT_FACTOR);
  const tracked = useRef(false);

  const touch = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "co2" });
    }
  };

  const result = useMemo(() => {
    const e = computeEnergy({
      areaM2: 140,
      orientation: "soer",
      household,
      ev: false,
      battery: true,
    });
    return computeCo2({
      smartDemandKwh: e.annualDemandKwh,
      smartSelfSufficiency: e.selfSufficiency,
      factor: CO2_FACTORS[factorKey],
    });
  }, [household, factorKey]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <h2 className="text-foreground text-lg font-semibold">{t("inputsHeading")}</h2>
        <div className="space-y-1.5">
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
            {HOUSEHOLDS.map((h) => (
              <option key={h} value={h}>
                {t(`householdOptions.${h}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="factor">{t("factor")}</Label>
          <select
            id="factor"
            className={selectClass}
            value={factorKey}
            onChange={(e) => {
              touch();
              setFactorKey(e.target.value as FactorKey);
            }}
          >
            {FACTOR_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(`factorOptions.${k}`)} ({CO2_FACTORS[k]} kg/kWh)
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">{t("factorNote")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-lg font-semibold">{t("resultsHeading")}</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">{t("savedLabel")}</p>
            <p className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
              {formatNumber(result.savedTonnes, 1)} {t("tonnesPerYear")}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("sensitivity", {
                low: formatNumber(result.savedLow, 1),
                high: formatNumber(result.savedHigh, 1),
              })}
            </p>
          </CardContent>
        </Card>

        <div className="border-border overflow-hidden rounded-lg border text-sm">
          <table className="w-full">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">{t("home")}</th>
                <th className="px-4 py-2 font-medium">{t("gridDraw")}</th>
                <th className="px-4 py-2 font-medium">{t("tonnes")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-border border-t">
                <td className="text-foreground px-4 py-2">{t("smart")}</td>
                <td className="text-muted-foreground px-4 py-2">{result.smartGridKwh} kWh</td>
                <td className="text-foreground px-4 py-2">{formatNumber(result.smartTonnes, 1)}</td>
              </tr>
              <tr className="border-border border-t">
                <td className="text-foreground px-4 py-2">{t("reference")}</td>
                <td className="text-muted-foreground px-4 py-2">{result.referenceGridKwh} kWh</td>
                <td className="text-foreground px-4 py-2">
                  {formatNumber(result.referenceTonnes, 1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-border space-y-2 border-t pt-4">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
            {(t.raw("assumptions") as string[]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <Disclaimer>{t("disclaimer")}</Disclaimer>
        </div>
      </div>
    </div>
  );
}
