"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PLOTS, ROW_INFO, type Plot } from "@/lib/klassisk/plots";
import { SITEPLAN as P } from "@/lib/klassisk/siteplan";
import { FACT, word } from "@/lib/facts";
import type { Design } from "@/lib/design";

type Props = {
  numbered?: boolean;
  selected?: number | null;
  activeRow?: Plot["row"] | "";
  /** a picker: every plot is a button */
  onSelect?: (n: number) => void;
  /** an overview: every plot is a link to its own page */
  hrefFor?: (n: number) => string;
  onRow?: (r: Plot["row"]) => void;
  showPills?: boolean;
  preserve?: string;
  revealOnView?: boolean;
  mode: "today" | "plan";
  locale?: "no" | "en";
  /** the design it sits in: the same plan, in each design's own colours */
  design?: Design;
  className?: string;
};

/** The two designs' palettes (src/app/(klassisk)/globals.css and src/app/(moderne)/globals.css). */
const COLOURS = {
  klassisk: { ground: "#F3F6F8", forest: "#E4EDE7", contour: "#A9C2B2", tree: "#3F6A52", ink: "#14263D", ink2: "#4A5A6E", built: "#6A7889", pine: "#3F6A52", road: "#C9D3DC", path: "#8FA5BD", fjord: "#2F5F85" },
  moderne: { ground: "#F5F8FA", forest: "#E3EDE6", contour: "#A7BFB0", tree: "#4F7156", ink: "#17283A", ink2: "#3A4D60", built: "#5A6975", pine: "#4F7156", road: "#CBD8E1", path: "#8FA9BE", fjord: "#2F6688" },
};

const TEXT = {
  no: {
    label: `Situasjonsplan på det målte terrenget: ${word(FACT.rows)} rekker med ${FACT.plots} tomter langs en vei som svinger i hårnålssvinger oppover Knotten`,
    parcel: `Eiendommen ${FACT.gnr}/${FACT.bnr}`, street: "Rødbergsveien", office: "Kontorbygg", house: "Bolighus", path: "Gangsti",
    row: "Rekke", plots: "tomter", plot: "Tomt", sight: "Siktlinje sørover mot Sniksfjorden og havet",
  },
  en: {
    label: `Site plan on the measured terrain: ${word(FACT.rows, "en")} rows with ${FACT.plots} plots along a road that climbs Knotten in hairpin bends`,
    parcel: `Property ${FACT.gnr}/${FACT.bnr}`, street: "Rødbergsveien", office: "Office", house: "House", path: "Footpath",
    row: "Row", plots: "plots", plot: "Plot", sight: "Sight line south towards Sniksfjorden and the sea",
  },
};

const office = P.buildings.find((b) => b.id === "bld-office");
const house = P.buildings.find((b) => b.id === "bld-house");
const [stX, stY, stA] = P.labels.street;

/**
 * The site plan on the measured terrain, north up: parcel 355/10, 5 m contours, the forest, and the owner's
 * plan as the model lays it out: four rows along a road with hairpin bends and a footpath through the rows.
 * One drawing for both designs (each with its own colours) and both languages: a picker (`onSelect`), an
 * overview whose plots link to their own pages (`hrefFor`), or a picture.
 */
export default function SitePlan({ numbered, selected, activeRow = "", onSelect, hrefFor, onRow, showPills, preserve = "xMidYMid meet", revealOnView, mode, locale = "no", design = "klassisk", className = "" }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    if (!revealOnView || !ref.current || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (setReveal(true), io.disconnect())), { threshold: 0.35 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [revealOnView]);
  const C = COLOURS[design];
  const t = TEXT[locale];
  const interactive = !!onSelect || !!hrefFor;

  return (
    // as a picker or an overview the plan is a group of named controls (inside role="img" they would be hidden from screen readers)
    <svg ref={ref} className={`plan siteplan${reveal ? " popin" : ""} ${className}`.trim()} data-mode={mode} data-design={design} viewBox="0 0 820 520" preserveAspectRatio={preserve} role={interactive ? "group" : "img"} aria-label={t.label}>
      <rect width="820" height="520" fill={C.ground} />
      <g className="layer layer-forest">
        <path d={P.forest} fill={C.forest} fillRule="evenodd" />
        <g fill="none" stroke={C.contour}>
          {P.contours.map((c) => <path key={c.z} d={c.d} strokeWidth={c.major ? 1.1 : 0.6} />)}
        </g>
        <g fill={C.tree} opacity=".35">
          {P.trees.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2 : 1.5} />)}
        </g>
      </g>
      <path d={P.parcel} fill="none" stroke={C.ink2} strokeWidth="1.2" strokeDasharray="6 3" />
      <path d={P.yard} fill="none" stroke={C.ink2} strokeWidth="0.8" strokeDasharray="2 3" />
      <text x={P.labels.parcel[0]} y={P.labels.parcel[1]} fontSize="10" fill={C.ink2}>{t.parcel}</text>
      <text x={P.labels.lokkeheia[0]} y={P.labels.lokkeheia[1]} fontSize="10" fill={C.ink2} fontStyle="italic">Løkkeheia</text>
      <text x={P.labels.knotten[0]} y={P.labels.knotten[1]} fontSize="10" fill={C.ink2} fontStyle="italic">Knotten</text>
      {P.street.map((d, i) => <path key={i} d={d} stroke={C.road} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
      <text x={stX} y={stY} fontSize="10" fill={C.ink2} transform={`rotate(${stA} ${stX} ${stY})`}>{t.street}</text>
      <g>
        {P.buildings.filter((b) => b.status === "existing").map((b) => <path key={b.id} d={b.d} fill={C.built} />)}
        {P.buildings.filter((b) => b.status === "planned").map((b) => <path key={b.id} d={b.d} fill="none" stroke={C.pine} strokeWidth="1.5" strokeDasharray="3 2" />)}
        {office && <text x={office.c[0]} y={office.c[1] + 3} fontSize="9" fill="#fff" textAnchor="middle" transform={`rotate(${office.angle} ${office.c[0]} ${office.c[1]})`}>{t.office}</text>}
        {house && <text x={house.c[0]} y={house.c[1] + 3} fontSize="9" fill="#fff" textAnchor="middle" transform={`rotate(${house.angle} ${house.c[0]} ${house.c[1]})`}>{t.house}</text>}
      </g>
      <g className="layer layer-plan">
        <path d={P.road} fill="none" stroke={C.road} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d={P.road} fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="6 8" opacity=".8" />
        <path d={P.path} stroke={C.path} strokeWidth="2" strokeDasharray="3 4" fill="none" />
        <text x={P.labels.gangsti[0]} y={P.labels.gangsti[1]} fontSize="9" fill={C.ink2} transform={`rotate(90 ${P.labels.gangsti[0]} ${P.labels.gangsti[1]})`}>{t.path}</text>
        <g className="plots">
          {PLOTS.map((p, i) => {
            const dim = activeRow && p.row !== activeRow;
            const shape = (
              <g transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
                <path className="sight" d="M0 8.3v40" stroke={C.fjord} strokeWidth="1" strokeDasharray="3 3" />
                <rect x="-10.7" y="-8.3" width="21.4" height="16.5" rx="2" fill={C.pine} />
                <path d="M-10.7 -8.3h21.4" stroke="#fff" strokeOpacity=".5" />
                {numbered && <text x="0" y="3.2" textAnchor="middle">{p.n}</text>}
              </g>
            );
            const cls = `plot${selected === p.n ? " sel" : ""}${dim ? " dim" : ""}`;
            const name = `${t.plot} ${p.n}, ${t.row.toLowerCase()} ${p.row}`;
            if (hrefFor) {
              return (
                <Link key={p.n} href={hrefFor(p.n)} prefetch={false} className={cls} data-n={p.n} style={{ animationDelay: `${i * 35}ms` }} aria-label={name}>
                  {shape}
                </Link>
              );
            }
            return (
              <g key={p.n} className={cls} data-n={p.n} style={{ animationDelay: `${i * 35}ms` }} onClick={() => onSelect?.(p.n)} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? name : undefined} aria-pressed={onSelect ? selected === p.n : undefined} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(p.n); } }}>
                {shape}
              </g>
            );
          })}
        </g>
        {showPills &&
          (Object.keys(ROW_INFO) as Plot["row"][]).map((r) => (
            <g key={r} className={`rowpill${activeRow === r ? " on" : ""}`} transform={`translate(${ROW_INFO[r].x} ${ROW_INFO[r].y - 15})`} style={{ cursor: "pointer" }} onClick={() => onRow?.(r)}>
              <rect width="92" height="30" rx="15" />
              <text x="10" y="13" fontSize="10" fontWeight="700">{t.row} {r}</text>
              <text x="10" y="24" fontSize="8.5" fill={C.ink2}>{ROW_INFO[r].count} {t.plots}</text>
            </g>
          ))}
        <text x="300" y="512" fontSize="10" fill={C.fjord} fontStyle="italic">{t.sight}</text>
        <path d="M292 508l-6 3 6 3" fill="none" stroke={C.fjord} strokeWidth="1" />
      </g>
      <g fill="none" stroke={C.ink2} strokeWidth="1">
        <path d={`M20 506h${P.scale_50m_px}M20 502v8M${20 + P.scale_50m_px} 502v8`} />
      </g>
      <text x={26 + P.scale_50m_px} y="509.5" fontSize="9" fill={C.ink2}>50 m</text>
    </svg>
  );
}
