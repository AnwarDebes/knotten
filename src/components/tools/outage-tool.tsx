"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { simulateOutage, criticalBackupHours, usableKwh, LOADS, type Season } from "@/lib/outage";
import { trackGoal, GOALS } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/primitives/disclaimer";

const HOURS = 48;

export function OutageTool() {
  const t = useTranslations("strombrudd");
  const [batteryKwh, setBatteryKwh] = useState(10);
  const [pvKwp, setPvKwp] = useState(8);
  const [season, setSeason] = useState<Season>("winter");
  const [solarRecharge, setSolarRecharge] = useState(true);
  const [hour, setHour] = useState(6);
  const tracked = useRef(false);

  const touch = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "strombrudd" });
    }
  };

  const { timeline } = useMemo(
    () => simulateOutage({ batteryKwh, pvKwp, season, solarRecharge }, HOURS),
    [batteryKwh, pvKwp, season, solarRecharge],
  );
  const headlineHours = criticalBackupHours(usableKwh(batteryKwh));
  const current = timeline[Math.min(hour, timeline.length - 1)]!;

  // Battery state-of-charge curve.
  const points = timeline
    .map((h, i) => `${(i / (HOURS - 1)) * 100},${100 - h.socPercent}`)
    .join(" ");

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <h2 className="text-foreground text-lg font-semibold">{t("inputsHeading")}</h2>

          <div className="space-y-2">
            <Label htmlFor="battery">
              {t("battery")}:{" "}
              <span className="text-muted-foreground font-normal">{batteryKwh} kWh</span>
            </Label>
            <input
              id="battery"
              type="range"
              min={0}
              max={30}
              step={1}
              value={batteryKwh}
              className="accent-sea w-full"
              onChange={(e) => {
                touch();
                setBatteryKwh(Number(e.target.value));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pv">
              {t("solar")}: <span className="text-muted-foreground font-normal">{pvKwp} kWp</span>
            </Label>
            <input
              id="pv"
              type="range"
              min={0}
              max={15}
              step={1}
              value={pvKwp}
              className="accent-sea w-full"
              onChange={(e) => {
                touch();
                setPvKwp(Number(e.target.value));
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              role="group"
              aria-label={t("seasonGroup")}
              className="border-border inline-flex rounded-md border p-1 text-sm"
            >
              {(["summer", "winter"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={season === s}
                  onClick={() => {
                    touch();
                    setSeason(s);
                  }}
                  className={
                    season === s
                      ? "bg-primary text-primary-foreground rounded px-3 py-1 font-medium"
                      : "text-muted-foreground rounded px-3 py-1"
                  }
                >
                  {s === "summer" ? t("summer") : t("winter")}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={solarRecharge}
                className="border-input accent-sea size-5 rounded"
                onChange={(e) => {
                  touch();
                  setSolarRecharge(e.target.checked);
                }}
              />
              {t("solarRecharge")}
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">{t("backupHeadline")}</p>
              <p className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
                {headlineHours} {t("hours")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{t("backupNote")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-foreground text-lg font-semibold">{t("timelineHeading")}</h2>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-hidden
          className="h-32 w-full"
        >
          <polyline
            points={points}
            fill="none"
            stroke="var(--sea)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={(hour / (HOURS - 1)) * 100}
            y1={0}
            x2={(hour / (HOURS - 1)) * 100}
            y2={100}
            stroke="var(--foreground)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="space-y-2">
          <Label htmlFor="hour">
            {t("hourLabel", { hour })}:{" "}
            <span className="text-muted-foreground font-normal">
              {t("socAt", { pct: current.socPercent })}
            </span>
          </Label>
          <input
            id="hour"
            type="range"
            min={0}
            max={HOURS - 1}
            step={1}
            value={hour}
            className="accent-sea w-full"
            onChange={(e) => setHour(Number(e.target.value))}
          />
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-sm">{t("loadsHeading")}</p>
          <ul className="flex flex-wrap gap-2">
            {LOADS.map((l) => {
              const on = current.loadsOn.includes(l.id);
              return (
                <li
                  key={l.id}
                  className={
                    on
                      ? "border-sea text-foreground rounded-full border px-3 py-1 text-sm"
                      : "border-border text-muted-foreground rounded-full border px-3 py-1 text-sm line-through"
                  }
                >
                  {t(`loads.${l.id}`)}
                  <span className="sr-only">: {on ? t("on") : t("off")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-border space-y-2 border-t pt-4">
        <h3 className="text-foreground text-sm font-semibold">{t("assumptionsHeading")}</h3>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
          {(t.raw("assumptions") as string[]).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
        <Disclaimer>{t("disclaimer")}</Disclaimer>
      </div>
    </div>
  );
}
