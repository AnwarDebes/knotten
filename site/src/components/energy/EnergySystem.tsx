import { FACT } from "@/lib/facts";
import s from "./EnergySystem.module.css";

/**
 * The sketch of the energy system as the project owner's direction describes it (4 September 2026): the sun
 * and possibly wind charge a battery in every home and perhaps a shared store, smart control shares the power
 * out to the homes, the office building and the warehouse, and the grid takes the surplus and covers the rest.
 * One drawing for both designs and both languages: Klassisk and Moderne each give it their own colours and
 * fonts. On a phone the same drawing stands tall instead of wide, so its words stay readable. Dashes flow along
 * the wires (still with reduced motion). A server component: no script.
 */
type Variant = "klassisk" | "moderne";
type Lang = "no" | "en";

const PALETTE: Record<Variant, { ink: string; ink2: string; ink3: string; grey: string; box: string; line: string; sun: string; sunPale: string; pine: string }> = {
  klassisk: { ink: "#14263D", ink2: "#4A5A6E", ink3: "#5C6979", grey: "#7C8A9B", box: "#EDF1F5", line: "#D4DCE4", sun: "#E3A33B", sunPale: "#F7E7C6", pine: "#3F6A52" },
  moderne: { ink: "#17283a", ink2: "#3a4d60", ink3: "#5a6975", grey: "#7f8e9b", box: "#e9f1f6", line: "#c9d6df", sun: "#e2a23b", sunPale: "#f6e3bf", pine: "#4f7156" },
};

const TEXT = {
  no: {
    label: "Systemskisse: sol og mulig vind lader batterier i hver bolig og et felles lager. Smart styring fordeler strømmen til boligene, kontorbygget og lager- og verkstedbygget, og strømnettet tar overskuddet og dekker underskuddet. Sandbatteriet er lagt bort.",
    sun: "Sol", sunSub: ["tak på boligene", "og et felles anlegg"],
    wind: "Vind", windSub: ["vurderes, krever", "lokale målinger"],
    battery: ["Batteri i", "hver bolig"], batterySub: ["med lokal", "energistyring"],
    shared: ["Felles lager"], sharedSub: ["vurderes for", "hele feltet"],
    sand: ["Sandbatteri er", "lagt bort"],
    smart: "Smart styring",
    homes: `${FACT.plots} boliger`, homesSub: "lavt energibehov, enkle tak mot sør",
    office: "Kontorbygget", officeSub: `${FACT.offices_now} kontorer i dag, ${FACT.offices_after} planlagt`,
    storage: "Lager og verksted", storageSub: "regnes som én bolig inntil videre",
    grid: "Strømnettet", gridSub: "ordinær tilknytning, mikronett utredes",
    exchange: "overskudd selges, underskudd kjøpes",
  },
  en: {
    label: "System sketch: the sun and possibly wind charge a battery in every home and a shared store. Smart control shares the power out to the homes, the office building and the warehouse and workshop, and the grid takes the surplus and covers the shortfall. The sand battery is dropped.",
    sun: "Sun", sunSub: ["home roofs and", "a shared plant"],
    wind: "Wind", windSub: ["evaluated, needs", "local measurements"],
    battery: ["Battery in", "every home"], batterySub: ["with local energy", "management"],
    shared: ["Shared storage"], sharedSub: ["assessed for the", "whole field"],
    sand: ["The sand battery", "is dropped"],
    smart: "Smart control",
    homes: `${FACT.plots} homes`, homesSub: "low energy demand, simple south roofs",
    office: "The office building", officeSub: `${FACT.offices_now} offices today, ${FACT.offices_after} planned`,
    storage: "Warehouse and workshop", storageSub: "counted as one home for now",
    grid: "The grid", gridSub: "ordinary connection, microgrid under study",
    exchange: "surplus is sold, shortfall is bought",
  },
} satisfies Record<Lang, unknown>;

type P = (typeof PALETTE)[Variant];
type Tx = (typeof TEXT)[Lang];

/** Lines of text one under the other, centred on x (or starting at it). */
function Lines({ x, y, lines, size, step, fill, name = false, anchor = "middle" }: { x: number; y: number; lines: string[]; size: number; step: number; fill: string; name?: boolean; anchor?: "middle" | "start" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} className={name ? s.name : undefined}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : step}>{l}</tspan>)}
    </text>
  );
}

function Arrow({ id, c }: { id: string; c: P }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5 0 10z" fill={c.ink2} /></marker>
    </defs>
  );
}

const House = ({ c }: { c: P }) => <path d="M0 24l16-14 16 14v22H0z" fill={c.ink} />;
const Office = ({ c }: { c: P }) => <rect width="34" height="36" y="8" fill={c.grey} />;
const Workshop = ({ c }: { c: P }) => <rect width="34" height="26" y="14" fill="none" stroke={c.pine} strokeWidth="1.5" strokeDasharray="3 2" />;
const Pylon = ({ c }: { c: P }) => <path d="M6 40V6M0 12h12M2 20h8" stroke={c.ink2} strokeWidth="2" fill="none" />;
const Turbine = ({ c }: { c: P }) => (
  <>
    <path d="M0 26V-2M0 -2l-14-20M0 -2l14-20" stroke={c.grey} strokeWidth="2" fill="none" strokeDasharray="3 3" />
    <circle r="4" fill={c.grey} />
  </>
);

/** Wide: sources, storage, control and the users from left to right (the drawing Klassisk has always had). */
function Wide({ c, t, id }: { c: P; t: Tx; id: string }) {
  const arr = `url(#${id})`;
  return (
    <svg viewBox="0 0 990 360" className={s.wide} role="img" aria-label={t.label}>
      <Arrow id={id} c={c} />
      <g fontSize="12" fill={c.ink}>
        <circle cx="120" cy="80" r="26" fill={c.sunPale} /><circle cx="120" cy="80" r="12" fill={c.sun} />
        <text x="120" y="126" textAnchor="middle" className={s.name}>{t.sun}</text>
        <text x="120" y="142" textAnchor="middle" fontSize="10" fill={c.ink2}>{t.sunSub.join(" ")}</text>
        <g transform="translate(120 240)"><Turbine c={c} /></g>
        <text x="120" y="292" textAnchor="middle" className={s.name} fill={c.ink2}>{t.wind}</text>
        <text x="120" y="308" textAnchor="middle" fontSize="10" fill={c.ink3}>{t.windSub.join(" ")}</text>
        <rect x="290" y="52" width="170" height="56" rx="8" fill={c.box} stroke={c.line} />
        <text x="375" y="76" textAnchor="middle" className={s.name}>{t.battery.join(" ")}</text>
        <text x="375" y="94" textAnchor="middle" fontSize="10" fill={c.ink2}>{t.batterySub.join(" ")}</text>
        <rect x="290" y="212" width="170" height="56" rx="8" fill={c.box} stroke={c.line} />
        <text x="375" y="236" textAnchor="middle" className={s.name}>{t.shared.join(" ")}</text>
        <text x="375" y="254" textAnchor="middle" fontSize="10" fill={c.ink2}>{t.sharedSub.join(" ")}</text>
        <rect x="290" y="290" width="170" height="40" rx="8" fill="none" stroke={c.grey} strokeDasharray="4 3" />
        <text x="375" y="314" textAnchor="middle" fontSize="10" fill={c.ink2}>{t.sand.join(" ")}</text>
        <rect x="500" y="132" width="120" height="44" rx="22" fill={c.ink} /><text x="560" y="159" textAnchor="middle" fill="#fff" className={s.name}>{t.smart}</text>
        <g transform="translate(700 40)"><House c={c} /><text x="42" y="34" className={s.name}>{t.homes}</text><text x="42" y="50" fontSize="10" fill={c.ink2}>{t.homesSub}</text></g>
        <g transform="translate(700 130)"><Office c={c} /><text x="42" y="30" className={s.name}>{t.office}</text><text x="42" y="46" fontSize="10" fill={c.ink2}>{t.officeSub}</text></g>
        <g transform="translate(700 210)"><Workshop c={c} /><text x="42" y="30" className={s.name}>{t.storage}</text><text x="42" y="46" fontSize="10" fill={c.ink2}>{t.storageSub}</text></g>
        <g transform="translate(700 290)"><Pylon c={c} /><text x="42" y="26" className={s.name}>{t.grid}</text><text x="42" y="42" fontSize="10" fill={c.ink2}>{t.gridSub}</text></g>
        <g stroke={c.ink2} strokeWidth="1.5" fill="none" markerEnd={arr}>
          <path className={s.flow} d="M150 80H286" /><path className={s.flow} d="M150 86C220 100 236 220 286 236" />
          <path d="M150 250H286" strokeDasharray="4 4" opacity=".6" />
          <path className={s.flow} d="M464 80H560V128" /><path className={s.flow} d="M464 240H560V180" />
          <path className={s.flow} d="M624 154H696" /><path className={s.flow} d="M600 132C640 90 660 68 696 64" /><path className={s.flow} d="M600 176C640 210 660 226 696 236" /><path className={s.flow} d="M600 176C650 250 660 300 696 316" />
        </g>
        <path d="M700 320C620 330 560 330 464 264" stroke={c.grey} strokeWidth="1.2" fill="none" strokeDasharray="3 4" />
        <text x="560" y="343" textAnchor="middle" fontSize="10" fill={c.ink3}>{t.exchange}</text>
      </g>
    </svg>
  );
}

/** Tall: the same parts from top to bottom, for narrow screens. */
function Tall({ c, t, id }: { c: P; t: Tx; id: string }) {
  const arr = `url(#${id})`;
  const N = 14, S = 12, NL = 17, SL = 15;
  // a box's lines, centred in it (from the first baseline to the last, plus half a capital's height)
  const boxLines = (x: number, top: number, h: number, name: string[], sub: string[]) => {
    const span = name.length * NL + (sub.length - 1) * SL;
    const y = top + (h - span) / 2 + 5;
    return (
      <>
        <Lines x={x} y={y} lines={name} size={N} step={NL} fill={c.ink} name />
        <Lines x={x} y={y + name.length * NL} lines={sub} size={S} step={SL} fill={c.ink2} />
      </>
    );
  };
  const user = (y0: number, icon: React.ReactNode, name: string, sub: string) => (
    <g>
      <g transform={`translate(22 ${y0 - 6})`}>{icon}</g>
      <text x="66" y={y0 + 17} fontSize={N} fill={c.ink} className={s.name}>{name}</text>
      <text x="66" y={y0 + 34} fontSize={S} fill={c.ink2}>{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 340 566" className={s.tall} role="img" aria-label={t.label}>
      <Arrow id={id} c={c} />
      {/* the sources */}
      <circle cx="90" cy="36" r="22" fill={c.sunPale} /><circle cx="90" cy="36" r="10" fill={c.sun} />
      <Lines x={90} y={80} lines={[t.sun]} size={N} step={NL} fill={c.ink} name />
      <Lines x={90} y={97} lines={t.sunSub} size={S} step={SL} fill={c.ink2} />
      <g transform="translate(250 38)"><Turbine c={c} /></g>
      <Lines x={250} y={80} lines={[t.wind]} size={N} step={NL} fill={c.ink2} name />
      <Lines x={250} y={97} lines={t.windSub} size={S} step={SL} fill={c.ink3} />
      {/* storage */}
      <rect x="16" y="154" width="148" height="84" rx="8" fill={c.box} stroke={c.line} />
      {boxLines(90, 154, 84, t.battery, t.batterySub)}
      <rect x="176" y="154" width="148" height="84" rx="8" fill={c.box} stroke={c.line} />
      {boxLines(250, 154, 84, t.shared, t.sharedSub)}
      <rect x="196" y="274" width="128" height="44" rx="8" fill="none" stroke={c.grey} strokeDasharray="4 3" />
      <Lines x={260} y={292} lines={t.sand} size={S} step={SL} fill={c.ink2} />
      {/* control */}
      <rect x="16" y="266" width="144" height="40" rx="20" fill={c.ink} />
      <text x="88" y="291" textAnchor="middle" fontSize={N} fill="#fff" className={s.name}>{t.smart}</text>
      {/* the users */}
      {user(336, <House c={c} />, t.homes, t.homesSub)}
      {user(390, <Office c={c} />, t.office, t.officeSub)}
      {user(444, <Workshop c={c} />, t.storage, t.storageSub)}
      {user(498, <g transform="translate(8 0)"><Pylon c={c} /></g>, t.grid, t.gridSub)}
      <text x="66" y="556" fontSize={S} fill={c.ink3}>{t.exchange}</text>
      <g stroke={c.ink2} strokeWidth="1.5" fill="none" markerEnd={arr}>
        <path className={s.flow} d="M90 122V148" />
        <path className={s.flow} d="M106 118C150 134 224 132 240 148" />
        <path d="M250 122V148" strokeDasharray="4 4" opacity=".6" />
        <path className={s.flow} d="M88 238V260" />
        <path className={s.flow} d="M248 238C248 258 200 266 166 276" />
        <path className={s.flow} d="M88 306V330" />
      </g>
    </svg>
  );
}

export default function EnergySystem({ variant, locale }: { variant: Variant; locale: Lang }) {
  const c = PALETTE[variant], t = TEXT[locale];
  return (
    <div className={variant === "moderne" ? `${s.sketch} ${s.moderne}` : s.sketch}>
      <Wide c={c} t={t} id={`energy-${variant}-wide`} />
      <Tall c={c} t={t} id={`energy-${variant}-tall`} />
    </div>
  );
}
