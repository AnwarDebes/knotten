"use client";

import { lazy, Suspense, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackGoal, GOALS } from "@/lib/analytics";
import { AMENITIES } from "@/content/amenities";

// Code-split: the map library only loads when the visitor asks for the map, so
// it stays out of the initial route bundle.
const AmenityMap = lazy(() => import("./amenity-map"));

export function NeighbourhoodMap() {
  const t = useTranslations("naromrade");
  const locale = useLocale();
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <div className="border-border bg-secondary/30 rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground mb-4 text-sm">{t("mapPrompt")}</p>
        <Button
          onClick={() => {
            trackGoal(GOALS.toolUse, { tool: "naromrade" });
            setShow(true);
          }}
        >
          {t("showMap")}
        </Button>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground text-sm" role="status">
          {t("mapLoading")}
        </p>
      }
    >
      <AmenityMap amenities={AMENITIES} en={locale === "en"} />
    </Suspense>
  );
}
