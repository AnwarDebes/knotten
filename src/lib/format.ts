/**
 * Norwegian number and currency formatting helpers.
 *
 * Used across the buyer-value tools and the energy concept so figures read the
 * way a Norwegian audience expects (space as the thousands separator, comma as
 * the decimal mark). All outputs are presentation only; the figures themselves
 * are indicative estimates that the calling feature labels and sources.
 */

const LOCALE = "nb-NO";

/** Format an amount in Norwegian kroner, e.g. 1234567 -> "1 234 567 kr". */
export function formatNOK(value: number, fractionDigits = 0): string {
  return `${formatNumber(value, fractionDigits)} kr`;
}

/** Format a plain number with Norwegian grouping, e.g. 14700 -> "14 700". */
export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format an energy quantity in kWh, e.g. 17200 -> "17 200 kWh". */
export function formatKwh(value: number, fractionDigits = 0): string {
  return `${formatNumber(value, fractionDigits)} kWh`;
}

/** Format a fraction (0..1) as a whole-number percentage, e.g. 0.62 -> "62 %". */
export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(fraction);
}
