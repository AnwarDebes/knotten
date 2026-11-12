import Image from "next/image";
import type { Lang } from "@/lib/facts/core";
import type { Person } from "@/lib/facts/team";
import { contourRings } from "@/lib/monogram";

/**
 * A person's portrait in the Klassisk look. Until there is a photo: the initials in the serif, set like a name on a
 * map over a small contour map of their own, in a round frame like the logo's. Decorative, because the name always
 * stands beside it; a photo, when there is one, carries its own description.
 */
export default function Monogram({ person, locale, size = 120 }: { person: Person; locale: Lang; size?: number }) {
  const style = { width: size, height: size };
  if (person.photo) {
    return (
      <span className="team-mono" style={style}>
        <Image src={person.photo.src} alt={person.photo.alt[locale]} width={person.photo.w} height={person.photo.h} sizes={`${size}px`} />
      </span>
    );
  }
  const rings = contourRings(person.slug);
  const [sx, sy] = rings[0].summit;
  return (
    <span className="team-mono" style={style} aria-hidden="true">
      <svg viewBox="0 0 200 200" focusable="false">
        <g fill="none" stroke="var(--fjord)" strokeWidth="1.3">
          {rings.map((r, i) => (
            <path key={i} d={r.d} opacity={0.7 - i * 0.08} />
          ))}
        </g>
        <circle cx={sx} cy={sy} r="2.6" fill="var(--fjord-deep)" />
        <text x="100" y="100" dy="0.35em" textAnchor="middle">{person.initials}</text>
      </svg>
    </span>
  );
}
