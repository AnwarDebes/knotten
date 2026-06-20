"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { computeEnergyConfig, type Orientation, type Household } from "@/lib/energy";
import { annualEnergyCost } from "@/lib/monthly-cost";
import { formatKwh, formatNOK, formatPercent } from "@/lib/format";
import { trackGoal, GOALS } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { HOUSE_TYPES } from "@/content/house-types";
import { PLOTS } from "@/content/plots";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

const ORIENTATIONS: Orientation[] = ["soer", "oestVest", "nord"];
const HOUSEHOLDS: Household[] = ["small", "medium", "large"];

export function ConfiguratorTool() {
  const t = useTranslations("konfigurator");
  const en = useLocale() === "en";

  const [typeId, setTypeId] = useState(HOUSE_TYPES[0]?.id ?? "");
  const type = HOUSE_TYPES.find((h) => h.id === typeId) ?? HOUSE_TYPES[0];
  const [plotId, setPlotId] = useState(PLOTS[0]?.id ?? "");
  const [orientation, setOrientation] = useState<Orientation>(
    HOUSE_TYPES[0]?.defaultOrientation ?? "soer",
  );
  const [household, setHousehold] = useState<Household>("medium");
  const [pvKwp, setPvKwp] = useState(HOUSE_TYPES[0]?.solar.default ?? 5);
  const [batteryKwh, setBatteryKwh] = useState(HOUSE_TYPES[0]?.battery.default ?? 5);
  const [ev, setEv] = useState(false);
  const tracked = useRef(false);

  const result = useMemo(() => {
    if (!type) return null;
    return computeEnergyConfig({
      areaM2: type.heatedAreaM2,
      orientation,
      household,
      ev,
      pvKwp,
      batteryKwh,
    });
  }, [type, orientation, household, ev, pvKwp, batteryKwh]);

  const touch = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "konfigurator" });
    }
  };

  // Empty state: no house types configured yet.
  if (!type || !result) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
        {t("empty")}
      </p>
    );
  }

  function selectType(id: string) {
    touch();
    const next = HOUSE_TYPES.find((h) => h.id === id) ?? HOUSE_TYPES[0]!;
    setTypeId(next.id);
    setOrientation(next.defaultOrientation);
    setPvKwp(next.solar.default);
    setBatteryKwh(next.battery.default);
  }

  const energyCost = annualEnergyCost(result.annualDemandKwh, result.selfSufficiency);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <h2 className="text-foreground text-lg font-semibold">{t("buildHeading")}</h2>

        <div className="space-y-1.5">
          <Label htmlFor="type">{t("houseType")}</Label>
          <select
            id="type"
            className={selectClass}
            value={typeId}
            onChange={(e) => selectType(e.target.value)}
          >
            {HOUSE_TYPES.map((h) => (
              <option key={h.id} value={h.id}>
                {(en ? h.nameEn : h.nameNo) + ` (${h.heatedAreaM2} m2)`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plot">{t("plot")}</Label>
          <select
            id="plot"
            className={selectClass}
            value={plotId}
            onChange={(e) => {
              touch();
              setPlotId(e.target.value);
            }}
          >
            {PLOTS.map((p) => (
              <option key={p.id} value={p.id}>
                {t("plot")} {p.code}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {t("placementNote")}{" "}
            <Link href="/omradet" className="text-sea hover:underline">
              {t("see3d")}
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="orientation">{t("orientation")}</Label>
            <select
              id="orientation"
              className={selectClass}
              value={orientation}
              onChange={(e) => {
                touch();
                setOrientation(e.target.value as Orientation);
              }}
            >
              {ORIENTATIONS.map((o) => (
                <option key={o} value={o}>
                  {t(`orientationOptions.${o}`)}
                </option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="solar">
            {t("solar")}: <span className="text-muted-foreground font-normal">{pvKwp} kWp</span>
          </Label>
          <input
            id="solar"
            type="range"
            min={type.solar.min}
            max={type.solar.max}
            step={0.5}
            value={pvKwp}
            className="accent-sea w-full"
            onChange={(e) => {
              touch();
              setPvKwp(Number(e.target.value));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batt">
            {t("battery")}:{" "}
            <span className="text-muted-foreground font-normal">{batteryKwh} kWh</span>
          </Label>
          <input
            id="batt"
            type="range"
            min={type.battery.min}
            max={type.battery.max}
            step={1}
            value={batteryKwh}
            className="accent-sea w-full"
            onChange={(e) => {
              touch();
              setBatteryKwh(Number(e.target.value));
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="ev"
            type="checkbox"
            checked={ev}
            className="border-input accent-sea size-5 rounded"
            onChange={(e) => {
              touch();
              setEv(e.target.checked);
            }}
          />
          <Label htmlFor="ev" className="font-normal">
            {t("ev")}
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-lg font-semibold">{t("resultsHeading")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Metric label={t("selfSufficiency")} value={formatPercent(result.selfSufficiency)} />
          <Metric label={t("backup")} value={`${result.resilienceHours} ${t("hours")}`} />
          <Metric label={t("demand")} value={formatKwh(result.annualDemandKwh)} />
          <Metric label={t("production")} value={formatKwh(result.annualProductionKwh)} />
          <Metric
            label={t("energyCost")}
            value={`${formatNOK(Math.round(energyCost))} ${t("perYear")}`}
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {t("more")}{" "}
          <Link href="/verktoy/manedskostnad" className="text-sea hover:underline">
            {t("monthlyLink")}
          </Link>
          .
        </p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-foreground mt-1 text-xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
