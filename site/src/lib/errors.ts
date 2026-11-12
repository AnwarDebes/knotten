/**
 * Problems a visitor should hear about in plain words, shared by the server (which throws them) and the browser
 * (which explains them). In production a thrown error reaches the browser only as a generic message and a digest,
 * so each known problem travels in the digest, which Next passes on unchanged. No Node imports here.
 */
export const PROBLEM_DIGEST = {
  /** The person may not do this (role or area). */
  forbidden: "KNOTTEN_FORBIDDEN",
  /** An administrator is viewing the portal as someone else, so changes are switched off. */
  preview: "KNOTTEN_PREVIEW",
  /** Records cannot be saved: the hosting has no database yet (lib/server/kv.ts). */
  storage: "KNOTTEN_STORAGE",
} as const;
export type Problem = keyof typeof PROBLEM_DIGEST;

/** An error that names its problem, so the error page can explain it in production as well. */
export class ProblemError extends Error {
  readonly problem: Problem;
  readonly digest: string;
  constructor(problem: Problem, message?: string) {
    super(message ?? problem);
    this.name = "ProblemError";
    this.problem = problem;
    this.digest = PROBLEM_DIGEST[problem];
  }
}

/** Which known problem an error is: by its digest (production), its own name, or its message (development). */
export function problemOf(e: unknown): Problem | null {
  if (!e || typeof e !== "object") return null;
  const { digest, problem, message } = e as { digest?: unknown; problem?: unknown; message?: unknown };
  for (const p of Object.keys(PROBLEM_DIGEST) as Problem[]) {
    if (digest === PROBLEM_DIGEST[p] || problem === p || message === p) return p;
  }
  return null;
}

/** What every form and action says when records cannot be saved. */
export const STORAGE_MESSAGE = {
  no: "Lagring er ikke satt opp ennå. Prøv igjen senere eller send en e-post.",
  en: "Storage is not set up yet. Try again later or send an email.",
} as const;
