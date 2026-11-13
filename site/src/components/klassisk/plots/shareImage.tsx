import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPlot } from "@/lib/data";
import { plotName, rowLabel, sunLabel } from "@/lib/format";
import { ASSUMPTIONS_VERSION, dateLong, fmt } from "@/lib/facts";
import { knottenTime, solarPosition } from "@/lib/solar";
import { klassiskFonts } from "@/lib/server/ogFonts";
import type { KLocale } from "@/lib/klassisk/locale";
import type { Plot } from "@/lib/types";

/**
 * The share card of a Klassisk plot page (/tomtene/07 and /english/tomtene/07): the plot's measured winter sun, view
 * and height, and its horizon with the sun's path on 21 December, in the light Klassisk palette and typefaces.
 * The Moderne plot pages have their own (src/app/(moderne)/[locale]/tomter/[id]/opengraph-image.tsx).
 */
export const SHARE = { width: 1200, height: 630 };

/** The Klassisk palette (src/app/(klassisk)/globals.css). */
const C = { paper: "#f6f8fa", paper2: "#edf1f5", ink: "#14263d", ink2: "#4a5a6e", ink3: "#5c6979", fjord: "#5d8db0", fjordDeep: "#2f5f85", pine: "#3f6a52", sun: "#e3a33b", line: "#d4dce4" };

/** The card's description, for the image's alt text. */
export function shareMetadata(nr: string | undefined, locale: KLocale) {
  const en = locale === "en";
  const name = nr && /^\d{2}$/.test(nr) ? plotName(`plot-${nr}`, !en) : en ? "The plot" : "Tomten";
  return [{
    id: "solpass",
    size: SHARE,
    contentType: "image/png",
    alt: en
      ? `${name} at Knotten: hours of sun on 21 December, water in view and height above the sea, with the horizon and the winter sun's path from the website's model`
      : `${name} på Knotten: timer med sol 21. desember, sjø i sikt og høyde over havet, med horisonten og vintersolens bane fra nettsidens modell`,
  }];
}

async function logo(): Promise<string | null> {
  try {
    const b = await readFile(join(process.cwd(), "public/img/logo-mark.png"));
    return `data:image/png;base64,${b.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The plot's measured horizon from south-east to south-west, and the sun's path on 21 December above it. */
function Horizon({ p, w, h }: { p: Plot; w: number; h: number }) {
  const from = 100, to = 260, maxEl = 16;
  const x = (b: number) => ((b - from) / (to - from)) * w;
  const y = (el: number) => h - (Math.max(0, el) / maxEl) * h;
  const hz = p.horizon_deg_by_bearing;
  let d = `M0,${h}`;
  for (let b = from; b <= to; b++) d += ` L${x(b).toFixed(1)},${y(hz[b % 360] ?? 0).toFixed(1)}`;
  d += ` L${w},${h} Z`;
  const sun: { cx: number; cy: number; up: boolean }[] = [];
  for (let m = 0; m < 1440; m += 12) {
    const s = solarPosition(knottenTime(2026, 12, 21, m / 60));
    if (s.elevation <= 0 || s.azimuth < from || s.azimuth > to) continue;
    sun.push({ cx: x(s.azimuth), cy: y(s.elevation), up: s.elevation > (hz[Math.round(s.azimuth) % 360] ?? 0) });
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill={C.pine} />
      {sun.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r={s.up ? 4 : 2.5} fill={C.sun} opacity={s.up ? 1 : 0.45} />)}
    </svg>
  );
}

export async function plotShareImage(nr: string | undefined, locale: KLocale) {
  const en = locale === "en";
  const lang = locale;
  const p = nr && /^\d{2}$/.test(nr) ? await loadPlot(`plot-${nr}`) : undefined;
  const [fonts, mark] = await Promise.all([klassiskFonts(), logo()]);
  const name = p ? plotName(p.id, !en) : "Knotten";
  const col = (label: string, value: string, sub: string) => (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 230, borderTop: `2px solid ${C.ink}`, paddingTop: 14 }}>
      <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: 72, lineHeight: 1, color: C.ink }}>{value}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: C.ink, marginTop: 10 }}>{label}</div>
      <div style={{ fontSize: 20, color: C.ink2, marginTop: 4 }}>{sub}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, color: C.ink, fontFamily: "Figtree", position: "relative" }}>
        {/* the contour lines of the site's background, faint, top right */}
        <svg width="560" height="440" viewBox="560 0 560 440" style={{ position: "absolute", right: 0, top: 0 }}>
          <g fill="none" stroke={C.fjord} strokeWidth="1.2">
            <path d="M900 190c-90-140 70-260 180-190 100 60 190 140 160 250-25 95-120 150-220 130-110-22-150-90-120-190z" opacity=".22" />
            <path d="M905 195c-70-110 50-205 145-150 85 50 160 118 132 205-22 78-100 122-180 106-90-18-125-75-97-161z" opacity=".18" />
            <path d="M910 200c-50-80 35-150 105-110 62 36 118 86 96 150-16 57-72 90-130 78-66-13-92-55-71-118z" opacity=".15" />
          </g>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 64px 0", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img elements, next/image does not apply */}
            {mark && <img src={mark} width={64} height={64} style={{ borderRadius: 64, border: "3px solid #ffffff", boxShadow: `0 0 0 1px ${C.line}` }} alt="" />}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: 30, letterSpacing: "0.16em", lineHeight: 1 }}>KNOTTEN</div>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.14em", color: C.ink3, marginTop: 6 }}>{en ? "SEA VIEW AT RØDBERG" : "SJØUTSIKT I RØDBERG"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 26 }}>
            <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: 112, lineHeight: 1, letterSpacing: "-0.012em" }}>{name}</div>
            {p && <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400, fontSize: 30, color: C.fjordDeep }}>{en ? `Row ${rowLabel(p)}, Rødberg in Lindesnes` : `Rekke ${rowLabel(p)}, Rødberg i Lindesnes`}</div>}
          </div>
          {p && (
            <div style={{ display: "flex", gap: 48, marginTop: 28 }}>
              {col(en ? "Sun 21 December" : "Sol 21. desember", `${fmt(p.sun.dec21.hours, lang, 1)} ${en ? "h" : "t"}`, `${sunLabel(p.sun.dec21.first_sun_cet)} ${en ? "to" : "til"} ${sunLabel(p.sun.dec21.last_sun_cet)}`)}
              {col(en ? "Water in view" : "Sjø i sikt", `${p.view.water_visible_deg}°`, p.view.open_sea_visible ? (en ? "with open sea" : "med åpent hav") : (en ? "the fjord" : "fjorden"))}
              {col(en ? "Height" : "Høyde", `${fmt(Math.round(p.local.z_ground), lang)} m`, en ? "above the sea" : "over havet")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 64px 10px", fontSize: 18, color: C.ink3 }}>
            <span>{en ? "The horizon from the plot and the sun's path on 21 December" : "Horisonten fra tomten og solens bane 21. desember"}</span>
            <span>{`${en ? "Computed" : "Beregnet"} ${dateLong(ASSUMPTIONS_VERSION, lang)}, ${en ? "provisional layout" : "foreløpig utlegg"}`}</span>
          </div>
          {p && <Horizon p={p} w={1200} h={120} />}
        </div>
      </div>
    ),
    { ...SHARE, fonts },
  );
}
