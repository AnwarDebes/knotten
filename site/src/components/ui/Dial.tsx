"use client";
import type { Locale } from "@/lib/i18n";
import { MONTHS, t } from "@/lib/i18n";
import { solarPosition, knottenTime } from "@/lib/solar";
import type { Design } from "@/lib/design";
import { daysIn } from "../viewLink";
import ks from "./Dial.module.css";

/** The dial's moment: a month, an hour (in quarters) and the day of the month (the 21st unless a shared link set another). */
export type DialValue = { month: number; hour: number; day?: number };

/** Sun and date. Two sliders, one readout; the amber dot on the thumb is the sun. */
export default function Dial({ value, onChange, locale, horizon, variant = "moderne" }: { value: DialValue; onChange: (v: DialValue) => void; locale: Locale; horizon?: number[]; /** the design it sits in */ variant?: Design }) {
  const k = variant === "klassisk";
  const d = t(locale);
  const day = value.day ?? 21;
  const date = knottenTime(2026, value.month, day, value.hour);
  const sun = solarPosition(date);
  const hz = horizon ? horizon[Math.round(sun.azimuth) % 360] : 0;
  const up = sun.elevation > hz + 0.25;
  const hh = Math.floor(value.hour);
  const mm = Math.round((value.hour - hh) * 60);
  // a day the next month does not have (the 31st, into November) becomes its last day
  const toMonth = (month: number) => (value.day === undefined ? { ...value, month } : { ...value, month, day: Math.min(value.day, daysIn(month)) });
  return (
    <div className={k ? ks.dial : "dial glass p-2.5 w-[min(80vw,210px)]"}>
      <div className={k ? ks.head : "flex items-baseline justify-between gap-3"}>
        <div className={k ? ks.time : "num text-[24px] leading-none"}>{hh}:{mm.toString().padStart(2, "0")}</div>
        <div className={k ? ks.when : "text-right"}>
          <div className={k ? ks.date : "display-italic text-[15px] leading-none"}>{`${day}. `}{MONTHS[locale][value.month - 1]}</div>
          <div className={k ? `${ks.sun} ${up ? ks.up : ""}` : `text-[11px] mt-0.5 ${up ? "text-[#f3cf93]" : "text-white/80"}`}>
            {up ? d.dial.sunUp : d.dial.sunDown}, {sun.elevation.toFixed(0)}°
          </div>
        </div>
      </div>
      <label className={k ? ks.label : "block mt-2 text-[11px] text-white/85"}>{d.dial.hour}
        <input type="range" className={k ? ks.range : undefined} min={0} max={23.75} step={0.25} value={value.hour} onChange={(e) => onChange({ ...value, hour: +e.target.value })} aria-label={d.dial.hour} aria-valuetext={`${hh}:${mm.toString().padStart(2, "0")}`} />
      </label>
      <label className={k ? ks.label : "block mt-1.5 text-[11px] text-white/85"}>{d.dial.month}
        <input type="range" className={k ? ks.range : undefined} min={1} max={12} step={1} value={value.month} onChange={(e) => onChange(toMonth(+e.target.value))} aria-label={d.dial.month} aria-valuetext={`${day}. ${MONTHS[locale][value.month - 1]}`} />
      </label>
    </div>
  );
}
