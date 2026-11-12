import { ImageResponse } from "next/og";
import { loadPlot } from "@/lib/data";
import { plotName, sunLabel } from "@/lib/format";
import { ASSUMPTIONS_VERSION, dateLong, fmt } from "@/lib/facts";
import { knottenTime, solarPosition } from "@/lib/solar";
import { moderneFonts } from "@/lib/server/ogFonts";
import type { Plot } from "@/lib/types";

const size = { width: 1200, height: 630 };
const contentType = "image/png";

/** The Moderne palette (src/app/(moderne)/globals.css): light sky, navy ink, fjord, pine; amber only for the sun. */
const C = { bg: "#f5f8fa", surface: "#ffffff", ink: "#17283a", ink2: "#3a4d60", muted: "#5a6975", fjord: "#2f6688", sky: "#cfe2ee", pine: "#4f7156", amber: "#e2a23b", line: "rgba(23,40,58,.14)" };

type Params = { locale: string; id: string };

/** The share card's description, in the page's language, for the image's alt text. */
export async function generateImageMetadata({ params }: { params?: Partial<Params> | Promise<Partial<Params>> }) {
  // the build also asks without a plot (to list the image), so every part is optional here
  const { locale, id } = (await params) ?? {};
  const no = locale !== "en";
  const plot = id ? plotName(id, no) : no ? "Tomten" : "The plot";
  return [{
    id: "solpass",
    size,
    contentType,
    alt: no
      ? `${plot} på Knotten: timer med sol 21. desember, sjø i sikt og høyde over havet, med horisonten og vintersolens bane fra nettsidens modell`
      : `${plot} at Knotten: hours of sun on 21 December, water in view and height above the sea, with the horizon and the winter sun's path from the website's model`,
  }];
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
      {sun.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r={s.up ? 4 : 2.5} fill={C.amber} opacity={s.up ? 1 : 0.45} />)}
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { id, locale } = await params;
  const p = id ? await loadPlot(id) : undefined;
  const no = locale !== "en";
  const lang = no ? "no" : "en";
  const name = id ? plotName(id, no) : "Knotten";
  const fonts = await moderneFonts();
  const col = (label: string, value: string, sub: string) => (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 220 }}>
      <div style={{ fontSize: 22, fontWeight: 500, color: C.muted }}>{label}</div>
      <div style={{ fontFamily: "Bricolage Grotesque", fontWeight: 600, fontSize: 76, lineHeight: 1, letterSpacing: "-0.03em", color: C.ink, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 21, color: C.ink2, marginTop: 10 }}>{sub}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.ink, fontFamily: "Geist", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: "56px 64px 0" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 22, fontWeight: 500, letterSpacing: "0.08em", color: C.fjord }}>
            {`KNOTTEN  ·  ${no ? "SJØUTSIKT I RØDBERG" : "SEA VIEW AT RØDBERG"}`}
          </div>
          <div style={{ fontFamily: "Bricolage Grotesque", fontWeight: 600, fontSize: 124, lineHeight: 1, letterSpacing: "-0.035em", marginTop: 18 }}>{name}</div>
          {p && (
            <div style={{ display: "flex", gap: 56, marginTop: 34 }}>
              {col(no ? "Sol 21. desember" : "Sun 21 December", `${fmt(p.sun.dec21.hours, lang, 1)} ${no ? "t" : "h"}`, `${sunLabel(p.sun.dec21.first_sun_cet)} ${no ? "til" : "to"} ${sunLabel(p.sun.dec21.last_sun_cet)}`)}
              {col(no ? "Sjø i sikt" : "Water in view", `${p.view.water_visible_deg}°`, p.view.open_sea_visible ? (no ? "med åpent hav" : "with open sea") : (no ? "fjorden" : "the fjord"))}
              {col(no ? "Høyde" : "Height", `${fmt(Math.round(p.local.z_ground), lang)} m`, no ? "over havet" : "above the sea")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 64px 10px", fontSize: 18, color: C.muted }}>
            <span>{no ? "Horisonten fra tomten og solens bane 21. desember" : "The horizon from the plot and the sun's path on 21 December"}</span>
            <span>{`${no ? "Beregnet" : "Computed"} ${dateLong(ASSUMPTIONS_VERSION, lang)}, ${no ? "foreløpig utlegg" : "provisional layout"}`}</span>
          </div>
          {p && <Horizon p={p} w={1200} h={128} />}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
