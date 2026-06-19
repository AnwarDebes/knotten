"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { computeEnergy, type EnergyInput, type Household, type Orientation } from "@/lib/energy";
import { formatKwh, formatNOK, formatNumber, formatPercent } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/primitives/disclaimer";

const ORIENTATIONS: Orientation[] = ["soer", "oestVest", "nord"];
const HOUSEHOLDS: Household[] = ["small", "medium", "large"];

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

function Result({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-foreground mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function EnergyCalculator() {
  const t = useTranslations("energiKalkulator");
  const [input, setInput] = useState<EnergyInput>({
    areaM2: 140,
    orientation: "soer",
    household: "medium",
    ev: false,
    battery: false,
  });
  const set = <K extends keyof EnergyInput>(key: K, value: EnergyInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const r = computeEnergy(input);
  const assumptions = t.raw("assumptions") as string[];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h2 className="text-foreground text-lg font-semibold">{t("inputsHeading")}</h2>

        <div className="space-y-2">
          <Label htmlFor="area">
            {t("area")}:{" "}
            <span className="text-muted-foreground font-normal">{input.areaM2} m²</span>
          </Label>
          <input
            id="area"
            type="range"
            min={80}
            max={250}
            step={10}
            value={input.areaM2}
            onChange={(e) => set("areaM2", Number(e.target.value))}
            className="bg-muted accent-sea focus-visible:ring-ring h-2 w-full cursor-pointer appearance-none rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-valuetext={`${input.areaM2} kvadratmeter`}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="orientation">{t("orientation")}</Label>
          <select
            id="orientation"
            className={selectClass}
            value={input.orientation}
            onChange={(e) => set("orientation", e.target.value as Orientation)}
          >
            {ORIENTATIONS.map((o) => (
              <option key={o} value={o}>
                {t(`orientationOptions.${o}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="household">{t("household")}</Label>
          <select
            id="household"
            className={selectClass}
            value={input.household}
            onChange={(e) => set("household", e.target.value as Household)}
          >
            {HOUSEHOLDS.map((h) => (
              <option key={h} value={h}>
                {t(`householdOptions.${h}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="ev"
            type="checkbox"
            checked={input.ev}
            onChange={(e) => set("ev", e.target.checked)}
            className="border-input accent-sea focus-visible:ring-ring size-5 rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
          />
          <Label htmlFor="ev">{t("ev")}</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="battery"
            type="checkbox"
            checked={input.battery}
            onChange={(e) => set("battery", e.target.checked)}
            className="border-input accent-sea focus-visible:ring-ring size-5 rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
          />
          <Label htmlFor="battery">{t("battery")}</Label>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-foreground text-lg font-semibold">{t("resultsHeading")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Result label={t("demand")} value={`${formatKwh(r.annualDemandKwh)} ${t("perYear")}`} />
          <Result
            label={t("production")}
            value={`${formatKwh(r.annualProductionKwh)} ${t("perYear")}`}
          />
          <Result label={t("selfSufficiency")} value={formatPercent(r.selfSufficiency)} />
          <Result label={t("savings")} value={`${formatNOK(r.annualSavingsNok)} ${t("perYear")}`} />
          {r.resilienceHours > 0 ? (
            <Result
              label={t("resilience")}
              value={`${formatNumber(r.resilienceHours)} ${t("hours")}`}
            />
          ) : null}
        </div>

        <Disclaimer>{t("disclaimer")}</Disclaimer>

        <details className="bg-muted/30 rounded-md border p-4">
          <summary className="text-foreground cursor-pointer text-sm font-medium">
            {t("assumptionsHeading")}
          </summary>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
