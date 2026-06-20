"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { computeEnergy } from "@/lib/energy";
import { computeMonthlyCost, ENOVA, type MonthlyCostInput } from "@/lib/monthly-cost";
import { formatNOK } from "@/lib/format";
import { trackGoal, GOALS } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Disclaimer } from "@/components/primitives/disclaimer";

// A representative Knotten home from the shared SPEC-05 energy model, so the
// energy line is consistent with the energy calculator and price tools.
const KNOTTEN = computeEnergy({
  areaM2: 140,
  orientation: "soer",
  household: "medium",
  ev: false,
  battery: true,
});

const DEFAULTS = {
  kjopesum: 5_000_000,
  egenkapital: 1_000_000,
  rentePercent: 5.5,
  lopetidYears: 25,
  felleskostnaderPerMonth: 1500,
};

export function MonthlyCostTool() {
  const t = useTranslations("manedskostnad");
  const locale = useLocale();
  const en = locale === "en";
  const [form, setForm] = useState(DEFAULTS);
  const tracked = useRef(false);

  const set = (key: keyof typeof DEFAULTS, value: number) => {
    if (!tracked.current) {
      tracked.current = true;
      trackGoal(GOALS.toolUse, { tool: "manedskostnad" });
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const result = useMemo(() => {
    const input: MonthlyCostInput = {
      kjopesum: form.kjopesum,
      egenkapital: Math.min(form.egenkapital, form.kjopesum),
      rentePercent: form.rentePercent,
      lopetidYears: form.lopetidYears,
      felleskostnaderPerMonth: form.felleskostnaderPerMonth,
      knottenAnnualKwh: KNOTTEN.annualDemandKwh,
      knottenSelfCover: KNOTTEN.selfSufficiency,
    };
    return computeMonthlyCost(input);
  }, [form]);

  const num = (key: keyof typeof DEFAULTS, label: string, step = 1, suffix?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label}
        {suffix ? <span className="text-muted-foreground font-normal"> ({suffix})</span> : null}
      </Label>
      <Input
        id={key}
        type="number"
        inputMode="decimal"
        step={step}
        value={form[key]}
        onChange={(e) => set(key, Number(e.target.value))}
      />
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <h2 className="text-foreground text-lg font-semibold">{t("inputsHeading")}</h2>
        {num("kjopesum", t("kjopesum"), 100000, "kr")}
        {num("egenkapital", t("egenkapital"), 50000, "kr")}
        <div className="grid grid-cols-2 gap-4">
          {num("rentePercent", t("rente"), 0.1, "%")}
          {num("lopetidYears", t("lopetid"), 1, t("years"))}
        </div>
        {num("felleskostnaderPerMonth", t("felleskostnader"), 100, "kr/mnd")}

        <div className="border-border space-y-2 border-t pt-4">
          <h3 className="text-foreground text-sm font-semibold">{t("enovaHeading")}</h3>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {ENOVA.map((e) => (
              <li key={e.key}>
                {t(`enova_${e.key}`)}: {Math.round(e.rate * 100)} % (
                {en ? e.capLabelEn : e.capLabelNo})
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">{t("enovaNote")}</p>
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-foreground text-lg font-semibold">{t("resultsHeading")}</h2>

        <div className="grid grid-cols-2 gap-4">
          <CostCard
            title={t("knotten")}
            accent="var(--success)"
            cost={result.knotten}
            labels={{
              loan: t("loan"),
              energy: t("energy"),
              felles: t("felles"),
              total: t("total"),
            }}
            perMonth={t("perMonth")}
          />
          <CostCard
            title={t("conventional")}
            accent="var(--muted-foreground)"
            cost={result.conventional}
            labels={{
              loan: t("loan"),
              energy: t("energy"),
              felles: t("felles"),
              total: t("total"),
            }}
            perMonth={t("perMonth")}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">{t("energyDeltaLabel")}</p>
            <p className="text-foreground mt-1 text-2xl font-semibold tracking-tight">
              {formatNOK(Math.round(result.energyDeltaMonthly))} {t("perMonth")}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("cumulative", {
                years: 20,
                kr: formatNOK(Math.round(result.cumulativeEnergyDelta(20))),
              })}
            </p>
          </CardContent>
        </Card>

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
    </div>
  );
}

function CostCard({
  title,
  accent,
  cost,
  labels,
  perMonth,
}: {
  title: string;
  accent: string;
  cost: {
    loanMonthly: number;
    energyMonthly: number;
    felleskostnaderMonthly: number;
    totalMonthly: number;
  };
  labels: { loan: string; energy: string; felles: string; total: string };
  perMonth: string;
}) {
  const row = (label: string, value: number) => (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{formatNOK(Math.round(value))}</span>
    </div>
  );
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-foreground font-medium">{title}</p>
        </div>
        {row(labels.loan, cost.loanMonthly)}
        {row(labels.energy, cost.energyMonthly)}
        {row(labels.felles, cost.felleskostnaderMonthly)}
        <div className="border-border mt-1 flex justify-between border-t pt-2 text-sm font-semibold">
          <span className="text-foreground">{labels.total}</span>
          <span className="text-foreground">
            {formatNOK(Math.round(cost.totalMonthly))} {perMonth}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
