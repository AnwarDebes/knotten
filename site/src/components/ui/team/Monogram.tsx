import Image from "next/image";
import type { Lang } from "@/lib/facts/core";
import type { Person } from "@/lib/facts/team";
import { ridges } from "@/lib/monogram";

/**
 * A person's portrait in the Moderne look. Until there is a photo: the initials in the display face over a horizon
 * of their own, a far ridge in fjord blue and a near one in pine under a light sky, in the site's rounded frame.
 * Decorative, because the name always stands beside it; a photo, when there is one, carries its own description.
 * Size it with the class (for example "w-28 h-28 md:w-56 md:h-56").
 */
export default function Monogram({ person, locale, className = "w-28 h-28" }: { person: Person; locale: Lang; className?: string }) {
  const frame = `relative block shrink-0 overflow-hidden rounded-[var(--radius-lg)] border line ${className}`;
  if (person.photo) {
    return (
      <span className={frame}>
        <Image src={person.photo.src} alt={person.photo.alt[locale]} fill sizes="240px" className="object-cover" />
      </span>
    );
  }
  const { far, near } = ridges(person.slug);
  return (
    <span className={frame} style={{ background: "linear-gradient(180deg, #ffffff 0%, var(--bg-2) 45%, var(--sky) 100%)" }} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" focusable="false">
        <path d={far} fill="var(--fjord-light)" opacity="0.55" />
        <path d={near} fill="var(--pine)" opacity="0.92" />
        <text x="100" y="86" dy="0.35em" textAnchor="middle" className="display" fill="var(--ink)" style={{ fontSize: 78 }}>{person.initials}</text>
      </svg>
    </span>
  );
}
