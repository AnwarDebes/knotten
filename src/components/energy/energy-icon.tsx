import { cn } from "@/lib/utils";

/**
 * Original line illustrations for each energy element (no third-party IP). They
 * use currentColor and a subtle, reduced-motion-safe pulse on the active part.
 */
const PATHS: Record<string, React.ReactNode> = {
  sol: (
    <>
      <circle cx="24" cy="24" r="8" className="energy-pulse" />
      <path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5L37 37M37 11l-3.5 3.5M14.5 33.5L11 37" />
    </>
  ),
  vind: (
    <>
      <path d="M24 26v16" />
      <path
        d="M24 26l-2-13a3 3 0 116-1zM24 26l13-2a3 3 0 11-1 6zM24 26l-11 11a3 3 0 11-4-4z"
        className="energy-pulse"
      />
    </>
  ),
  bergvarme: (
    <>
      <path d="M6 30h36" />
      <path d="M16 30v8M24 30v10M32 30v8" />
      <path d="M20 22c0-3 4-3 4-6s-4-3-4-6M28 22c0-3 4-3 4-6s-4-3-4-6" className="energy-pulse" />
    </>
  ),
  batteri: (
    <>
      <rect x="10" y="14" width="26" height="20" rx="3" />
      <path d="M36 20h3v8h-3" />
      <path d="M22 19l-3 6h5l-3 6" className="energy-pulse" />
    </>
  ),
  "delt-base": (
    <>
      <path d="M12 16h24v22a2 2 0 01-2 2H14a2 2 0 01-2-2z" />
      <path d="M12 22h24M12 28h24M12 34h24" className="energy-pulse" />
      <path d="M16 16v-2a8 8 0 0116 0v2" />
    </>
  ),
  hub: (
    <>
      <circle cx="24" cy="24" r="5" className="energy-pulse" />
      <circle cx="10" cy="12" r="3" />
      <circle cx="38" cy="12" r="3" />
      <circle cx="10" cy="36" r="3" />
      <circle cx="38" cy="36" r="3" />
      <path d="M20 21l-8-7M28 21l8-7M20 27l-8 7M28 27l8 7" />
    </>
  ),
  v2g: (
    <>
      <path d="M8 30h26v-6l-4-7H14l-4 7z" />
      <circle cx="15" cy="33" r="3" />
      <circle cx="29" cy="33" r="3" />
      <path d="M40 18v8M40 18l-3 4h6l-3 4" className="energy-pulse" />
    </>
  ),
  robusthet: (
    <>
      <path d="M24 6l16 6v9c0 9-6.5 15-16 18-9.5-3-16-9-16-18v-9z" />
      <path d="M25 17l-5 8h5l-5 8" className="energy-pulse" />
    </>
  ),
};

function EnergyIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn("text-sea size-10", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[id] ?? PATHS.hub}
    </svg>
  );
}

export { EnergyIcon };
