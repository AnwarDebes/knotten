import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FACT } from "@/lib/facts";
import { klassiskFonts } from "@/lib/server/ogFonts";

/** Made once, when the site is built: the same picture for every Klassisk page (src/lib/meta.ts, klassiskMeta). */
export const dynamic = "force-static";

/** The Klassisk palette (src/app/(klassisk)/globals.css). */
const C = { paper: "#f6f8fa", ink: "#14263d", ink2: "#4a5a6e", ink3: "#5c6979", fjord: "#5d8db0", fjordDeep: "#2f5f85", seaTop: "#9cbbd3", flat: "#dce8e0", pine: "#3f6a52", pineDark: "#2c4c3a", sun: "#e3a33b", line: "#d4dce4" };

async function logo(): Promise<string | null> {
  try {
    const b = await readFile(join(process.cwd(), "public/img/logo-mark.png"));
    return `data:image/png;base64,${b.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The share card of the Klassisk design: the round logo, the headline as a goal, and the principle section from the
 * sea to Knotten that the front page draws (TerrainCut), with the rows of homes facing south and the sun above.
 */
export async function GET() {
  const [fonts, mark] = await Promise.all([klassiskFonts(), logo()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.paper, color: C.ink, fontFamily: "Figtree", position: "relative" }}>
        {/* the contour lines of the site's background, faint, top right */}
        <svg width="560" height="440" viewBox="560 0 560 440" style={{ position: "absolute", right: 0, top: 0 }}>
          <g fill="none" stroke={C.fjord} strokeWidth="1.2">
            <path d="M900 190c-90-140 70-260 180-190 100 60 190 140 160 250-25 95-120 150-220 130-110-22-150-90-120-190z" opacity=".22" />
            <path d="M905 195c-70-110 50-205 145-150 85 50 160 118 132 205-22 78-100 122-180 106-90-18-125-75-97-161z" opacity=".18" />
            <path d="M910 200c-50-80 35-150 105-110 62 36 118 86 96 150-16 57-72 90-130 78-66-13-92-55-71-118z" opacity=".15" />
          </g>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", padding: "56px 64px", width: 700, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img elements, next/image does not apply */}
            {mark && <img src={mark} width={84} height={84} style={{ borderRadius: 84, border: "3px solid #ffffff", boxShadow: "0 0 0 1px #d4dce4" }} alt="" />}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: 38, letterSpacing: "0.16em", lineHeight: 1 }}>KNOTTEN</div>
              <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.14em", color: C.ink3, marginTop: 8 }}>SJØUTSIKT I RØDBERG</div>
            </div>
          </div>
          <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400, fontSize: 28, color: C.fjordDeep, marginTop: 52 }}>Rødberg i Lindesnes, ved Audna elvas utløp</div>
          <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: 60, lineHeight: 1.05, letterSpacing: "-0.012em", marginTop: 14 }}>Planlagt som Norges mest energivennlige boligfelt.</div>
          <div style={{ fontSize: 25, lineHeight: 1.45, color: C.ink2, marginTop: 22, maxWidth: 560 }}>{`Rundt ${FACT.plots} tomter i rekker oppover en skogkledd knaus over Sniksfjorden.`}</div>
        </div>
        {/* the principle section from the sea to Knotten, as on the front page (not to scale) */}
        <svg width="500" height="355" viewBox="380 60 380 270" style={{ position: "absolute", right: 0, bottom: 0 }}>
          <rect x="380" y="190" width="200" height="140" fill={C.fjord} />
          <rect x="380" y="190" width="200" height="16" fill={C.seaTop} />
          <path d="M400 242c40-4 80-6 120-6 40 0 80 2 120 4v90H400z" fill={C.flat} />
          <path d="M560 240c40-10 70-40 95-80 20-32 45-60 70-70 12-4 25-6 35-6V330H560z" fill={C.pine} />
          <path d="M560 240c40-10 70-40 95-80 20-32 45-60 70-70 12-4 25-6 35-6" fill="none" stroke={C.pineDark} strokeWidth="1.5" />
          <g fill={C.ink}>
            <path d="M600 216l10-9 10 9v10h-20z" /><path d="M628 196l10-9 10 9v10h-20z" /><path d="M652 170l10-9 10 9v10h-20z" /><path d="M676 146l10-9 10 9v10h-20z" /><path d="M700 118l10-9 10 9v10h-20z" /><path d="M724 96l10-9 10 9v10h-20z" />
          </g>
          <rect x="470" y="228" width="22" height="12" fill="#7c8a9b" /><rect x="510" y="226" width="30" height="14" fill="#7c8a9b" />
          <circle cx="640" cy="92" r="13" fill={C.sun} />
        </svg>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
