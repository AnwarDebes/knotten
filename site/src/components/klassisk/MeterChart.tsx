import type { Building } from "@/lib/server/records";
import { meterName, yearTotals } from "@/lib/content/buildings";

const MONTHS = {
  no: ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const nf = (v: number, locale: "no" | "en") => Math.round(v).toLocaleString(locale === "no" ? "nb-NO" : "en-GB");

/**
 * Measured monthly consumption for one of the buildings on the property, in the Klassisk look:
 * the last 24 months as bars, months with an upgrade in sun yellow. Shown only when the owner has
 * loaded meter data in the portal and chosen to publish it.
 */
export default function MeterChart({ b, locale = "no" }: { b: Building; locale?: "no" | "en" }) {
  const rows = b.readings.slice(-24);
  const W = 420, H = 150, left = 34, bottom = 22, top = 14;
  const max = Math.max(1, ...rows.map((r) => r.kwh));
  const bw = (W - left - 6) / Math.max(1, rows.length);
  const ups = new Set(b.upgrades.map((u) => u.date.slice(0, 7)));
  const names = MONTHS[locale];
  const label = locale === "no"
    ? `${meterName(b, "no")}: målt forbruk per måned, ${rows[0]?.month} til ${rows[rows.length - 1]?.month}`
    : `${meterName(b, "en")}: measured consumption per month, ${rows[0]?.month} to ${rows[rows.length - 1]?.month}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <g stroke="#E3E9EF" strokeWidth="1"><path d={`M${left} ${top}H${W - 4}M${left} ${(top + H - bottom) / 2}H${W - 4}M${left} ${H - bottom}H${W - 4}`} /></g>
      <text x="2" y={top + 4} fontSize="9" fill="#5C6979">{nf(max, locale)}</text>
      <text x="2" y={H - bottom} fontSize="9" fill="#5C6979">kWh</text>
      {rows.map((r, i) => {
        const h = ((H - top - bottom) * r.kwh) / max;
        const m = Number(r.month.slice(5, 7)) - 1;
        return (
          <g key={r.month}>
            <rect x={left + i * bw + bw * 0.15} y={H - bottom - h} width={bw * 0.7} height={h} rx="1.5" fill={ups.has(r.month) ? "var(--sun)" : "var(--fjord-deep)"}>
              <title>{`${names[m]} ${r.month.slice(0, 4)}: ${nf(r.kwh, locale)} kWh`}</title>
            </rect>
            {/* each January, and the first month unless a January follows within two (the labels would run together) */}
            {(m === 0 || (i === 0 && m < 10)) && <text x={left + i * bw} y={H - 6} fontSize="9" fill="#5C6979">{`${names[m]} ${r.month.slice(2, 4)}`}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** The years side by side, as the portal's meter view shows them: the total, kWh per m² for a full year, and the months it covers. */
export function MeterYears({ b, locale = "no" }: { b: Building; locale?: "no" | "en" }) {
  const no = locale === "no";
  const years = yearTotals(b);
  return (
    <div className="tbl meteryears">
      <table>
        <caption className="sr">{no ? `Forbruk per år, ${meterName(b, "no")}` : `Consumption per year, ${meterName(b, "en")}`}</caption>
        <thead><tr><th scope="col">{no ? "År" : "Year"}</th><th scope="col" className="n">kWh</th>{b.area_m2 ? <th scope="col" className="n">kWh/m²</th> : null}<th scope="col" className="n">{no ? "Måneder" : "Months"}</th></tr></thead>
        <tbody>
          {years.map((y) => (
            <tr key={y.year}>
              <td>{y.year}</td>
              <td className="n">{nf(y.kwh, locale)}</td>
              {b.area_m2 ? <td className="n">{y.perM2 === null ? "" : nf(y.perM2, locale)}</td> : null}
              <td className="n">{y.months}{y.months < 12 ? (no ? " (delvis)" : " (partial)") : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
