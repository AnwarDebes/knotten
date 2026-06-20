"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { trackGoal, GOALS } from "@/lib/analytics";
import { PLOTS, type PlotStatus } from "@/content/plots";
import type { Heightmap } from "@/components/terrain/types";
import {
  directSunHours,
  daypartStates,
  representativeDay,
  type DaypartState,
} from "@/lib/sun-terrain";

const STATUS_VARIANT: Record<PlotStatus, "success" | "warning" | "destructive"> = {
  ledig: "success",
  reservert: "warning",
  solgt: "destructive",
};

type PlotSun = {
  id: string;
  code: string;
  status: PlotStatus;
  decHours: number;
  junHours: number;
  states: DaypartState[];
};

export function SunTool() {
  const t = useTranslations("sol");
  const [heightmap, setHeightmap] = useState<Heightmap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [season, setSeason] = useState<"summer" | "winter">("summer");
  const tracked = useRef(false);

  const touch = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "sol" });
    }
  };

  useEffect(() => {
    let ok = true;
    fetch("/terrain/heightmap.json")
      .then((r) => r.json())
      .then((h: Heightmap) => {
        if (ok) {
          setHeightmap(h);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (ok) setStatus("error");
      });
    return () => {
      ok = false;
    };
  }, []);

  const plots = useMemo<PlotSun[]>(() => {
    if (!heightmap) return [];
    return PLOTS.map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      decHours: directSunHours(heightmap, p.u, p.v, representativeDay("winter")),
      junHours: directSunHours(heightmap, p.u, p.v, representativeDay("summer")),
      states: daypartStates(heightmap, p.u, p.v, season),
    }));
  }, [heightmap, season]);

  const daypartLabel = (label: DaypartState["label"]) => t(`daypart.${label}`);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <Link href="/omradet" className="text-sea text-sm hover:underline">
          {t("see3d")}
        </Link>
      </div>

      {status === "loading" ? (
        <p className="text-muted-foreground text-sm" role="status">
          {t("loading")}
        </p>
      ) : status === "error" ? (
        <p className="text-muted-foreground text-sm" role="status">
          {t("error")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plots.map((p) => (
            <li key={p.id}>
              <Card className="h-full">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">
                      {t("plot")} {p.code}
                    </span>
                    <Badge variant={STATUS_VARIANT[p.status]}>{t(`status.${p.status}`)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">{t("june")}</p>
                      <p className="text-foreground text-xl font-semibold">
                        {p.junHours} {t("hoursShort")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{t("december")}</p>
                      <p className="text-foreground text-xl font-semibold">
                        {p.decHours} {t("hoursShort")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      {season === "summer" ? t("summer") : t("winter")}: {t("daypartHeading")}
                    </p>
                    <ul className="flex gap-2">
                      {p.states.map((s) => (
                        <li
                          key={s.label}
                          className="border-border flex-1 rounded-md border px-2 py-1 text-center text-xs"
                        >
                          <span className="block" aria-hidden>
                            {s.sunlit ? "☀" : "☁"}
                          </span>
                          <span className="text-muted-foreground block">
                            {daypartLabel(s.label)}
                          </span>
                          <span className="sr-only">
                            {daypartLabel(s.label)}: {s.sunlit ? t("sunlit") : t("shaded")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="border-border space-y-2 border-t pt-4">
        <h2 className="text-foreground text-sm font-semibold">{t("methodHeading")}</h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
          {(t.raw("method") as string[]).map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">{t("source")}</p>
        <Disclaimer>{t("disclaimer")}</Disclaimer>
      </div>
    </div>
  );
}
