import type { Plot } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { solarPosition, knottenTime } from "@/lib/solar";
import type { Design } from "@/lib/design";
import { plotName } from "@/lib/format";
import ks from "./HorizonChart.module.css";

/** Terrain horizon by bearing with the sun's path on three dates. Server-rendered SVG. */
export default function HorizonChart({ plot, locale, variant = "moderne" }: { plot: Plot; locale: Locale; /** the design it sits in: Klassisk gets its own skin (default Moderne) */ variant?: Design }) {
  if (variant === "klassisk") return <KlassiskHorizonChart plot={plot} locale={locale} />;
  const W = 720, H = 220, padL = 34, padB = 22, padT = 10;
  const maxEl = 60;
  const x = (b: number) => padL + (b / 360) * (W - padL - 8);
  const y = (el: number) => padT + (1 - Math.max(0, el) / maxEl) * (H - padT - padB);
  const hz = plot.horizon_deg_by_bearing;
  const path = hz.map((v, b) => `${b === 0 ? "M" : "L"}${x(b).toFixed(1)},${y(v).toFixed(1)}`).join(" ") + ` L${x(360)},${y(0)} L${x(0)},${y(0)} Z`;
  const sunPath = (month: number) => {
    const pts: string[] = [];
    for (let m = 0; m < 1440; m += 10) {
      const s = solarPosition(knottenTime(2026, month, 21, m / 60));
      if (s.elevation <= 0) continue;
      pts.push(`${x(s.azimuth).toFixed(1)},${y(s.elevation).toFixed(1)}`);
    }
    return pts;
  };
  const dates = [[12, "#d9a441"], [3, "#9fb3bf"], [6, "#5f7d6a"]] as const;
  const no = locale === "no";
  const dirs = [[0, "N"], [90, "Ø"], [180, "S"], [270, "V"]] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="horizon">
      <rect x={padL} y={padT} width={W - padL - 8} height={H - padT - padB} fill="#f6f4ee" />
      {[15, 30, 45].map((el) => <line key={el} x1={padL} x2={W - 8} y1={y(el)} y2={y(el)} stroke="rgba(23,33,42,.12)" />)}
      {[15, 30, 45].map((el) => <text key={el} x={padL - 4} y={y(el) + 4} fontSize="11" textAnchor="end" fill="#6b7680">{el}°</text>)}
      <path d={path} fill="#2b3a45" opacity="0.92" />
      {dates.map(([mo, col]) => {
        const pts = sunPath(mo);
        return pts.map((p, i) => <circle key={`${mo}-${i}`} cx={+p.split(",")[0]} cy={+p.split(",")[1]} r="1.6" fill={col} />);
      })}
      {dirs.map(([b, l]) => <text key={b} x={x(b)} y={H - 6} fontSize="11" textAnchor="middle" fill="#6b7680">{no ? l : l === "Ø" ? "E" : l === "V" ? "W" : l}</text>)}
      <g fontSize="11" fill="#17212a">
        <circle cx={W - 190} cy={padT + 10} r="3" fill="#d9a441" /><text x={W - 183} y={padT + 14}>21 {no ? "des" : "Dec"}</text>
        <circle cx={W - 130} cy={padT + 10} r="3" fill="#9fb3bf" /><text x={W - 123} y={padT + 14}>21 {no ? "mar" : "Mar"}</text>
        <circle cx={W - 70} cy={padT + 10} r="3" fill="#5f7d6a" /><text x={W - 63} y={padT + 14}>21 {no ? "jun" : "Jun"}</text>
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ the Klassisk skin
/** The same chart in Klassisk's colours and type, with a description a screen reader can read out. */
function KlassiskHorizonChart({ plot, locale }: { plot: Plot; locale: Locale }) {
  const W = 720, H = 220, padL = 34, padB = 22, padT = 10;
  const maxEl = 60;
  const x = (b: number) => padL + (b / 360) * (W - padL - 8);
  const y = (el: number) => padT + (1 - Math.max(0, el) / maxEl) * (H - padT - padB);
  const hz = plot.horizon_deg_by_bearing;
  const path = hz.map((v, b) => `${b === 0 ? "M" : "L"}${x(b).toFixed(1)},${y(v).toFixed(1)}`).join(" ") + ` L${x(360)},${y(0)} L${x(0)},${y(0)} Z`;
  const sunPath = (month: number) => {
    const pts: [number, number][] = [];
    for (let m = 0; m < 1440; m += 10) {
      const s = solarPosition(knottenTime(2026, month, 21, m / 60));
      if (s.elevation <= 0) continue;
      pts.push([+x(s.azimuth).toFixed(1), +y(s.elevation).toFixed(1)]);
    }
    return pts;
  };
  const no = locale === "no";
  const dates = [[12, ks.dec, no ? "21. des" : "21 Dec"], [3, ks.mar, no ? "21. mar" : "21 Mar"], [6, ks.jun, no ? "21. jun" : "21 Jun"]] as const;
  const dirs = no ? ([[0, "N"], [90, "Ø"], [180, "S"], [270, "V"]] as const) : ([[0, "N"], [90, "E"], [180, "S"], [270, "W"]] as const);
  const label = no
    ? `Horisonten rundt ${plotName(plot.id, true).toLowerCase()}: terrengets høyde over horisonten i hver retning, med solens bane 21. desember, 21. mars og 21. juni.`
    : `The horizon around ${plotName(plot.id, false).toLowerCase()}: the terrain's angle above the horizon in every direction, with the sun's path on 21 December, 21 March and 21 June.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={ks.svg} role="img" aria-label={label}>
      <rect x={padL} y={padT} width={W - padL - 8} height={H - padT - padB} className={ks.bg} />
      {[15, 30, 45].map((el) => <line key={el} x1={padL} x2={W - 8} y1={y(el)} y2={y(el)} className={ks.grid} />)}
      {[15, 30, 45].map((el) => <text key={el} x={padL - 4} y={y(el) + 4} textAnchor="end" className={ks.axis}>{el}°</text>)}
      <path d={path} className={ks.terrain} />
      {dates.map(([mo, cls]) => sunPath(mo).map(([cx, cy], i) => <circle key={`${mo}-${i}`} cx={cx} cy={cy} r="1.6" className={cls} />))}
      {dirs.map(([b, l]) => <text key={b} x={x(b)} y={H - 6} textAnchor="middle" className={ks.axis}>{l}</text>)}
      <g className={ks.legend}>
        {dates.map(([mo, cls, name], i) => (
          <g key={mo}>
            <circle cx={W - 196 + i * 62} cy={padT + 10} r="3" className={cls} />
            <text x={W - 189 + i * 62} y={padT + 14}>{name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
