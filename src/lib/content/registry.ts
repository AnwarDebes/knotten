/**
 * Known content-block and image-slot keys the owner can edit. Keeping the set
 * explicit (rather than free-form) means the public templates can rely on a slot
 * existing, while the editor still renders any extra rows found in the database.
 */

export const KNOWN_BLOCKS: { key: string; label: string; hint: string }[] = [
  { key: "hero", label: "Hero (forside)", hint: "Kort ingress overst pa forsiden" },
  { key: "kontakt", label: "Kontaktinfo", hint: "Kontaktdetaljer i bunn og pa kontaktsiden" },
];

export const KNOWN_IMAGE_SLOTS: { key: string; label: string; hint: string }[] = [
  { key: "hero-bg", label: "Hero-bakgrunn", hint: "Bakgrunnsbilde pa forsiden" },
  { key: "omrade-1", label: "Omradebilde", hint: "Illustrasjon av omradet" },
  { key: "visjon-1", label: "Visjonsbilde", hint: "Illustrasjon pa visjonssiden" },
];
