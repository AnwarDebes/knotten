import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * The sight corridor as two bands, one per eye height, cut from the one computed picture
 * (public/renders/sightline_panorama.png, 905 x 270): each band with its compass scale, under a heading in the
 * page's own words, and one line that says what the colours mean. Only the picture's own title strips and the
 * half-cut numbers at its two edges are left outside the frame. The same in both designs; `labelClass` is the
 * design's small-text class.
 */
const SRC = "/renders/sightline_panorama.png";
const W = 905;
/** the part of the picture each band shows: from x, y, with width and height, in the picture's own pixels */
const CUT = { x: 23, w: 872, h: 119 };
const BANDS = [
  { y: 16, no: "Stående, 2 m over bakken", en: "Standing, 2 m above the ground" },
  { y: 151, no: "Første etasje, 5 m over bakken", en: "First floor, 5 m above the ground" },
];

export default function SightlineBands({ locale, alt, labelClass }: { locale: "no" | "en"; alt: string; labelClass?: string }) {
  const no = locale === "no";
  return (
    <div role="img" aria-label={alt} style={{ display: "grid", gap: 6 }}>
      {BANDS.map((b, i) => {
        const frame: CSSProperties = { position: "relative", overflow: "hidden", aspectRatio: `${CUT.w} / ${CUT.h}`, borderRadius: 8, marginBottom: i === 0 ? 10 : 0 };
        const img: CSSProperties = { position: "absolute", maxWidth: "none", width: `${(W / CUT.w) * 100}%`, height: "auto", left: `${(-CUT.x / CUT.w) * 100}%`, top: `${(-b.y / CUT.h) * 100}%`, borderRadius: 0 };
        return (
          <div key={b.y}>
            <div className={labelClass} style={{ marginBottom: 4 }}>{no ? b.no : b.en}</div>
            <div style={frame}><Image src={SRC} alt="" width={W} height={270} unoptimized style={img} /></div>
          </div>
        );
      })}
      <div className={labelClass} style={{ marginTop: 6 }}>
        {no
          ? "Mørk blå: åpent hav, minst 7 km unna. Mellomblå: fjord, minst 1,5 km unna. Lys blå: vann nær land. Grå: ikke vann. Tallene er kompassretning i grader."
          : "Dark blue: open sea, at least 7 km away. Mid blue: fjord, at least 1.5 km away. Light blue: water close to land. Grey: no water. The numbers are compass bearings in degrees."}
      </div>
    </div>
  );
}
