/**
 * Privacy-first analytics helper. All measurement goes through Plausible
 * (cookieless, EU-hosted): no cookies, no cross-site tracking, no personal
 * data. Goal names are stable identifiers configured once in the Plausible
 * account. Properties must never carry personal data (no name, email, phone or
 * free text), only coarse, non-identifying context.
 */

export const GOALS = {
  interestComplete: "Interesse fullfort",
  prospektDownload: "Prospekt nedlasting",
  toolUse: "Verktoy brukt",
} as const;

export type GoalName = (typeof GOALS)[keyof typeof GOALS];

type PlausibleProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps }) => void;
  }
}

/**
 * Fire a Plausible goal. A no-op during server rendering or when the script is
 * not loaded (for example in development with no analytics domain configured),
 * so call sites never need to guard.
 */
export function trackGoal(event: GoalName, props?: PlausibleProps): void {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
