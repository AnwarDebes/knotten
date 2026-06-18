"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { cn } from "@/lib/utils";
import { PLOTS, type PlotStatus } from "@/content/plots";
import type { Heightmap, SunSeason, SunTime } from "./types";

const TerrainCanvas = lazy(() => import("./terrain-canvas"));

const STATUS_VARIANT: Record<PlotStatus, "success" | "warning" | "destructive"> = {
  ledig: "success",
  reservert: "warning",
  solgt: "destructive",
};

function detectCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  if (window.innerWidth < 768) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PlotMap() {
  const t = useTranslations("terrain");
  const [capable, setCapable] = useState(false);
  const [heightmap, setHeightmap] = useState<Heightmap | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [season, setSeason] = useState<SunSeason>("summer");
  const [time, setTime] = useState<SunTime>("midday");

  useEffect(() => {
    if (!detectCapable()) return;
    let ok = true;
    fetch("/terrain/heightmap.json")
      .then((r) => r.json())
      .then((data: Heightmap) => {
        if (ok) {
          setHeightmap(data);
          setCapable(true);
        }
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

  const show3D = capable && heightmap;
  const selected = PLOTS.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">{t("heading")}</h2>
        <p className="text-foreground mt-2 max-w-prose leading-7">{t("intro")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <div className="bg-secondary/40 relative aspect-[16/10] overflow-hidden rounded-lg border">
            {show3D ? (
              <Suspense fallback={null}>
                <TerrainCanvas
                  heightmap={heightmap}
                  plots={PLOTS}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id || null)}
                  season={season}
                  time={time}
                />
              </Suspense>
            ) : (
              // Pre-baked, already-optimised JPEG; a plain img avoids pulling the
              // next/image runtime into the shared bundle.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/terrain/fallback.jpg"
                alt={t("imageAlt")}
                width={1600}
                height={1000}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {show3D ? (
            <div className="flex flex-wrap gap-4">
              <fieldset className="flex items-center gap-2">
                <legend className="sr-only">{t("sun.season")}</legend>
                <span className="text-muted-foreground text-sm">{t("sun.season")}:</span>
                {(["summer", "winter"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={season === s ? "default" : "outline"}
                    onClick={() => setSeason(s)}
                  >
                    {t(`sun.${s}`)}
                  </Button>
                ))}
              </fieldset>
              <fieldset className="flex items-center gap-2">
                <legend className="sr-only">{t("sun.label")}</legend>
                <span className="text-muted-foreground text-sm">{t("sun.label")}:</span>
                {(["morning", "midday", "evening"] as const).map((tm) => (
                  <Button
                    key={tm}
                    size="sm"
                    variant={time === tm ? "default" : "outline"}
                    onClick={() => setTime(tm)}
                  >
                    {t(`sun.${tm}`)}
                  </Button>
                ))}
              </fieldset>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">{t("fallbackNote")}</p>
          )}

          <p className="text-muted-foreground text-xs">{t("attribution")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase">
            {t("plotsHeading")}
          </h3>
          <ul className="space-y-2">
            {PLOTS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  aria-pressed={selectedId === p.id}
                  className={cn(
                    "hover:bg-accent focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                    selectedId === p.id ? "border-sea bg-accent" : "border-border",
                  )}
                >
                  <span className="text-foreground font-medium">
                    {t("plotPrefix")} {p.code}
                  </span>
                  <Badge variant={STATUS_VARIANT[p.status]}>{t(`status.${p.status}`)}</Badge>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <div className="bg-card rounded-md border p-3 text-sm">
              <p className="text-foreground font-semibold">
                {t("plotPrefix")} {selected.code}
              </p>
              <p className="text-muted-foreground mt-1">{t("selectedSightline")}</p>
              <p className="text-muted-foreground mt-1">{t("pricePending")}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("selectHint")}</p>
          )}
        </div>
      </div>

      <Disclaimer>{t("forbehold")}</Disclaimer>
    </div>
  );
}
