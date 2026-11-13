"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SitePlan from "./SitePlan";
import KFollowPlotButton from "./members/FollowPlotButton";
import { type Plot } from "@/lib/klassisk/plots";
import { photoIn } from "@/lib/content/photos";
import { SORTS, STATUS_TEXT, priceText, sortPlots, type PlotSort, type PlotStatus, type PlotSummary } from "@/lib/content/plots";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { sunLabel } from "@/lib/format";
import { fmt } from "@/lib/facts/core";

type Scene = "plan" | "tomt" | "utsikt" | "omgivelser";
type Row = Plot["row"];

const T = {
  no: {
    strip: ["Oversikt", "Utsikten", "Omgivelser"], row: "Rekke", scenes: "Scener", plots: "Tomter", home: "Forside", title: "Tomtene", count: "tomter",
    chooseRow: "Velg rekke", all: "Alle", sortBy: "Sorter etter", sort: "Sorter", chosen: "valgt", back: "Alle tomter", chosenPlot: "Valgt tomt", plot: "Tomt",
    masl: "moh", maslLong: "moh", seaPin: "Sikt mot åpent hav", viewCap: "Fra nabotomten, litt lavere enn feltet. Foto:", seaOpen: "Åpent hav", photo: "Foto",
    note: "Tomtegrensene er veiledende. Reguleringsplan er ikke vedtatt, avvik vil forekomme.", close: "Lukk",
    sunDec: "Sol 21. des", sunMar: "Sol 21. mars", sunJun: "Sol 21. juni", water: "Sjø i sikt", openSea: "Åpent hav", floor: "Gulvnivå", slope: "Helning", status: "Status",
    hours: "t", to: "til", yes: "ja", no: "nei", cardSun: "sol 21. des", cardWater: "sjø i sikt",
    method: "Regnet fra terrenget for det foreløpige utlegget, fra stuegulvet. Juni i sommertid.",
    fromPlot: "Fra tomt", stillAlt: (n: number, b: number) => `Utsikten fra tomt ${n} i 3D-modellen, mot ${b} grader`, stillCap: (n: number, b: number) => `Modellbilde fra tomt ${n}, ikke et fotografi: foran huset, 1,6 m over gulvnivå, mot ${b} grader, 21. juni kl. 15.00.`,
    page: "Se tomtesiden", interest: "Meld interesse", configure: "Sett sammen huset", broker: "Salg skjer gjennom megler.", list: "Alle tomtene",
  },
  en: {
    strip: ["Overview", "The view", "Surroundings"], row: "Row", scenes: "Scenes", plots: "Plots", home: "Home", title: "Plots", count: "plots",
    chooseRow: "Choose a row", all: "All", sortBy: "Sort by", sort: "Sort", chosen: "chosen", back: "All plots", chosenPlot: "Chosen plot", plot: "Plot",
    masl: "m a.s.l.", maslLong: "m above sea level", seaPin: "View to open sea", viewCap: "From the neighbouring plot, a little lower than the field. Photo:", seaOpen: "Open sea", photo: "Photo",
    note: "The plot boundaries are indicative. The zoning plan is not adopted, and changes will come.", close: "Close",
    sunDec: "Sun 21 Dec", sunMar: "Sun 21 Mar", sunJun: "Sun 21 Jun", water: "Water in view", openSea: "Open sea", floor: "Floor level", slope: "Slope", status: "Status",
    hours: "h", to: "to", yes: "yes", no: "no", cardSun: "sun 21 Dec", cardWater: "water in view",
    method: "Computed from the terrain for the provisional layout, from the living-room floor. June in summer time.",
    fromPlot: "From plot", stillAlt: (n: number, b: number) => `The view from plot ${n} in the 3D model, towards ${b} degrees`, stillCap: (n: number, b: number) => `Model view from plot ${n}, not a photograph: in front of the house, 1.6 m above the floor level, towards ${b} degrees, 21 June at 15:00.`,
    page: "See the plot page", interest: "Register interest", configure: "Configure your house", broker: "Sales go through an estate agent.", list: "All the plots",
  },
};

const DOT: Record<PlotStatus, string> = { available: "g", reserved: "f", sold: "n", unreleased: "u" };
const TAG: Record<PlotStatus, string> = { available: "green", reserved: "blue", sold: "grey", unreleased: "grey" };

/**
 * The plot picker: the site plan on a full-height stage, a floating panel with the plots and their measured sun and
 * view, the status and price the administrator set, sorting, and a filmstrip of scenes. `?tomt=07` in the address
 * opens that plot, and choosing a plot puts it there, so a chosen plot can be shared.
 */
export default function PlotStage({ plots, releaseNote, locale = "no" }: { plots: PlotSummary[]; releaseNote: string; locale?: KLocale }) {
  const t = T[locale];
  const lang = locale;
  const [scene, setScene] = useState<Scene>("plan");
  const [row, setRow] = useState<Row | "">("");
  const [sort, setSort] = useState<PlotSort>("row");
  const [sel, setSel] = useState<number | null>(null);
  const [note, setNote] = useState(true);
  const visible = useMemo(() => sortPlots(plots.filter((p) => !row || p.row === row), sort), [plots, row, sort]);
  const p = sel ? plots.find((q) => q.n === sel) ?? null : null;
  const view = photoIn("view", lang);
  const fjord = photoIn("sniksfjorden", lang);
  const body = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);

  // ?tomt=07 (or Moderne's ?plot=plot-07) opens that plot. The page is the same for everyone, so the address is read
  // here, once, after the page has loaded
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("tomt") ?? q.get("plot")?.replace(/^plot-/, "") ?? "";
    const n = /^\d{1,2}$/.test(raw.trim()) ? Number(raw) : NaN;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is outside React and only known in the browser; the page itself is static
    if (plots.some((x) => x.n === n)) setSel(n);
  }, [plots]);

  const choose = (n: number | null) => {
    setSel(n);
    if (!n && scene === "tomt") setScene("plan");
    // the chosen plot goes into the address, so the link can be shared and the back button leaves the page
    const q = new URLSearchParams(window.location.search);
    q.delete("plot");
    if (n) q.set("tomt", String(n).padStart(2, "0"));
    else q.delete("tomt");
    const s = q.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
    body.current?.scrollTo({ top: 0 });
  };
  // on a narrow screen the chosen plot's details open above the list: bring them into view
  useEffect(() => { if (sel && window.innerWidth < 900) detail.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [sel]);

  const go = (s: Scene, r: Row | "") => {
    setScene(s);
    setRow(r);
  };
  // with a plot chosen, the strip also offers the view from that plot in the model
  const strip: { scene: Scene; row: Row | ""; label: string }[] = [
    { scene: "plan", row: "", label: t.strip[0] },
    ...(["A", "B", "C", "D"] as Row[]).map((r) => ({ scene: "plan" as Scene, row: r, label: `${t.row} ${r}` })),
    ...(p?.still ? [{ scene: "tomt" as Scene, row: "" as const, label: `${t.fromPlot} ${p.n}` }] : []),
    { scene: "utsikt", row: "", label: t.strip[1] },
    { scene: "omgivelser", row: "", label: t.strip[2] },
  ];
  // (the scene of the chosen plot goes when the choice goes)
  const shown: Scene = scene === "tomt" && !p?.still ? "plan" : scene;
  const h = (v: number) => fmt(v, lang, 1);
  const sun = (d: PlotSummary["sun"]["dec"], summer = false) => `${h(d.hours)} ${t.hours}, ${sunLabel(d.first_sun_cet, summer)} ${t.to} ${sunLabel(d.last_sun_cet, summer)}`;

  return (
    <div className="stage">
      <div className="scenes">
        {/* (inert while hidden: the keyboard never lands on a scene that is not shown) */}
        <div className={`scene${shown === "plan" ? " on" : ""}`} data-scene="plan" inert={shown !== "plan"}>
          <SitePlan mode="plan" numbered showPills selected={sel} activeRow={row} onSelect={choose} onRow={(r) => go("plan", row === r ? "" : r)} locale={locale} />
        </div>
        <div className={`scene${shown === "tomt" ? " on" : ""}`} data-scene="tomt" inert={shown !== "tomt"}>
          {p?.still && (
            <>
              <Image src={p.still.src} alt={t.stillAlt(p.n, p.still.bearing)} width={1920} height={1080} sizes="100vw" quality={90} />
              <p className="pk-cap">{t.stillCap(p.n, p.still.bearing)}</p>
            </>
          )}
        </div>
        <div className={`scene${shown === "utsikt" ? " on" : ""}`} data-scene="utsikt" inert={shown !== "utsikt"}>
          <Image src={view.src} alt={view.alt} width={view.w} height={view.h} sizes="100vw" quality={85} />
          <div className="pin" style={{ left: "58%", top: "36%" }}><i />{t.seaPin}</div>
          <div className="hero-cap">{t.viewCap} {view.credit}</div>
        </div>
        <div className={`scene${shown === "omgivelser" ? " on" : ""}`} data-scene="omgivelser" inert={shown !== "omgivelser"}>
          <Image src={fjord.src} alt={fjord.alt} width={fjord.w} height={fjord.h} sizes="100vw" quality={85} />
          <div className="pin" style={{ left: "30%", top: "31%" }}><i />{t.seaOpen}</div>
          <div className="hero-cap">{fjord.caption}. {t.photo}: {fjord.credit}, {fjord.license}</div>
        </div>

        {note && (
          <div className="snote">
            {t.note}
            <button type="button" aria-label={t.close} onClick={() => setNote(false)}>×</button>
          </div>
        )}
        <div className="scompass" aria-hidden="true">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#D4DCE4" /><path d="M20 6l6 16-6-4-6 4z" fill="#14263D" /><path d="M20 34l-6-16 6 4 6-4z" fill="#C9D3DC" /><text x="20" y="4" textAnchor="middle" fontSize="7" fill="#14263D" fontWeight="700">N</text></svg>
        </div>
        <div className="strip" role="group" aria-label={t.scenes}>
          {strip.map((b) => (
            <button key={b.scene + b.row} type="button" aria-pressed={shown === b.scene && row === b.row} onClick={() => go(b.scene, b.row)}>
              <span className={`th ${b.scene === "plan" && !b.row ? "th-plan" : b.scene === "plan" ? "th-row" : ""}`}>
                {b.scene === "plan" && b.row && <><i /><i /><i /></>}
                {b.scene === "tomt" && p?.still && <Image src={p.still.src} alt="" width={1920} height={1080} sizes="96px" />}
                {b.scene === "utsikt" && <Image src={view.src} alt="" width={view.w} height={view.h} sizes="96px" />}
                {b.scene === "omgivelser" && <Image src={fjord.src} alt="" width={fjord.w} height={fjord.h} sizes="96px" />}
              </span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="spanel" aria-label={t.plots}>
        <header>
          <div className="crumb"><Link href={kHref("/", locale)}>{t.home}</Link> / {t.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: "1.7rem", lineHeight: 1.08 }}>{t.title}</h1>
            <span className="small">{visible.length} {t.count}</span>
          </div>
          <div className="filters" style={{ marginTop: 12 }} role="group" aria-label={t.chooseRow}>
            <button type="button" className="chip" aria-pressed={row === ""} onClick={() => go("plan", "")}>{t.all}</button>
            {(["A", "B", "C", "D"] as const).map((r) => (
              <button key={r} type="button" className="chip" aria-pressed={row === r} onClick={() => go("plan", r)}>{t.row} {r}</button>
            ))}
          </div>
          <div className="filters psort" role="group" aria-label={t.sortBy}>
            <span className="small" aria-hidden>{t.sort}</span>
            {SORTS.map((s) => (
              <button key={s.key} type="button" className="chip" aria-pressed={sort === s.key} aria-label={s.label[lang]} onClick={() => setSort(s.key)}>{s.short[lang]}</button>
            ))}
          </div>
        </header>
        <p className="sr" role="status">{p ? `${t.plot} ${p.n}, ${t.row.toLowerCase()} ${p.row}, ${t.chosen}` : ""}</p>
        <div className="sbody" ref={body}>
          {p && (
            <div className="detail" ref={detail}>
              <button type="button" className="back" onClick={() => choose(null)}><span aria-hidden>‹ </span>{t.back}</button>
              <div className="eyebrow" style={{ margin: "6px 0 2px" }}>{t.chosenPlot}</div>
              <h2 className="pk-name">{t.plot} {p.n}</h2>
              <p className="small" style={{ marginTop: 4 }}>{t.row} {p.row}, {fmt(Math.round(p.ground), lang)} {t.maslLong}.{p.note ? ` ${p.note[lang]}.` : ""}</p>
              <p className="pk-status"><span className={`tag ${TAG[p.status]}`}>{STATUS_TEXT[p.status][lang]}</span> <b>{priceText(p.price, lang)}</b></p>
              <dl className="kv pk">
                <div><dt>{t.sunDec}</dt><dd>{sun(p.sun.dec)}</dd></div>
                <div><dt>{t.sunMar}</dt><dd>{sun(p.sun.mar)}</dd></div>
                <div><dt>{t.sunJun}</dt><dd>{sun(p.sun.jun, true)}</dd></div>
                <div><dt>{t.water}</dt><dd>{p.water}°</dd></div>
                <div><dt>{t.openSea}</dt><dd>{p.openSea ? `${t.yes}, ${p.openSeaDeg}°` : t.no}</dd></div>
                <div><dt>{t.floor}</dt><dd>{fmt(p.floor, lang, 1)} {t.masl}</dd></div>
                <div><dt>{t.slope}</dt><dd>{fmt(Math.round(p.slope), lang)}°</dd></div>
              </dl>
              <p className="small" style={{ marginTop: 10 }}>{t.method}</p>
              <div className="cta-row" style={{ marginTop: 14, gap: 8 }}>
                <Link className="btn sm" href={kHref(`/tomtene/${p.nr}`, locale)}>{t.page}</Link>
                <Link className="btn sm ghost" href={kHref(`/kontakt?tomt=${p.nr}`, locale)}>{t.interest}</Link>
                <Link className="btn sm ghost" href={kHref(`/konfigurator?tomt=${p.nr}`, locale)}>{t.configure}</Link>
                <KFollowPlotButton plotId={p.id} locale={locale} />
              </div>
            </div>
          )}
          <h2 className="sr">{t.list}</h2>
          <div className="cards">
            {visible.map((q) => (
              <button key={q.n} type="button" aria-pressed={sel === q.n} className={`card${sel === q.n ? " sel" : ""}`} onClick={() => choose(q.n)}>
                <span className="ico"><i /></span>
                <b>{t.plot} {q.n}</b>
                <span className="m">{t.row} {q.row}, {fmt(Math.round(q.ground), lang)} {t.masl}</span>
                <span className="m">{h(q.dec)} {t.hours} {t.cardSun}</span>
                <span className="m">{q.water}° {t.cardWater}</span>
                <span className="m"><span className={`dot ${DOT[q.status]}`} />{STATUS_TEXT[q.status][lang]}{q.price ? `, ${priceText(q.price, lang)}` : ""}</span>
              </button>
            ))}
          </div>
        </div>
        <footer>{releaseNote} {t.broker}</footer>
      </aside>
    </div>
  );
}
