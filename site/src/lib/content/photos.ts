import type { Lang, T } from "@/lib/facts";

/**
 * Every photo on the site, once, for both designs and both languages: the project owner's own photos of the view
 * and the photos of the area shared on Wikimedia Commons, each with who took it and the licence. One file per photo
 * (the originals, served through next/image); nothing else on the site keeps a second copy.
 */
export type PhotoKey = "view" | "view2" | "viewWide" | "summer" | "sniksfjorden" | "snig" | "vigeland" | "spangereid" | "audna";

export type SharedPhoto = {
  key: PhotoKey;
  src: string;
  w: number;
  h: number;
  alt: T;
  caption: T;
  /** the photographer, or the company for the project owner's own photos */
  by: string;
  from: "owner" | "commons";
  license: T;
  /** the photo's page on Wikimedia Commons */
  url?: string;
};

const OWN: T = { no: "Prosjektets eget bilde", en: "The project's own photo" };
const same = (s: string): T => ({ no: s, en: s });

export const PHOTO: Record<PhotoKey, SharedPhoto> = {
  view: {
    key: "view",
    src: "/img/view.jpg", w: 1440, h: 1440,
    alt: { no: "Utsikten fra Knotten mot Sniksfjorden og havet, fotografert fra nabotomten", en: "The view from Knotten towards Sniksfjorden and the sea, photographed from the neighbouring plot" },
    caption: { no: "Utsikten mot Sniksfjorden og havet, fotografert fra nabotomten som ligger litt lavere enn feltet", en: "The view towards Sniksfjorden and the sea, photographed from the neighbouring plot, which lies a little lower than the field" },
    by: "Sigve Simonsen AS", from: "owner", license: OWN,
  },
  view2: {
    key: "view2",
    src: "/img/view-2.jpg", w: 1331, h: 1331,
    alt: { no: "Utsikten fra Knotten mot Sniksfjorden, med gårdstunet og elva nedenfor", en: "The view from Knotten towards Sniksfjorden, with the farmyard and the river below" },
    caption: { no: "Det samme utsiktsbildet i et annet utsnitt, med gårdstunet, veien og elva nedenfor", en: "The same view in another crop, with the farmyard, the road and the river below" },
    by: "Sigve Simonsen AS", from: "owner", license: OWN,
  },
  viewWide: {
    key: "viewWide",
    src: "/assets/incoming/web/photo_fjord_wide.webp", w: 721, h: 435,
    alt: { no: "Utsikten sørover mot Sniksfjorden, med furu i forgrunnen og elva i dalen", en: "The view south towards Sniksfjorden, with a pine in front and the river in the valley" },
    caption: { no: "Utsikten sørover mot Sniksfjorden, fotografert fra nabotomten, litt lavere enn feltet", en: "The view south towards Sniksfjorden, photographed from the neighbouring plot, a little lower than the field" },
    by: "Sigve Simonsen AS", from: "owner", license: OWN,
  },
  summer: {
    key: "summer",
    src: "/assets/incoming/web/photo_sea_summer.webp", w: 649, h: 892,
    alt: { no: "Sommer over fjorden: blå himmel, en skogkledd odde og en stripe hav mellom åsene", en: "Summer over the fjord: blue sky, a wooded headland and a strip of sea between the hills" },
    caption: { no: "Sommer over fjorden. Bilde fra prosjekteier; hvor det er tatt, er ikke oppgitt", en: "Summer over the fjord. A photo from the project owner; where it was taken is not stated" },
    by: "Sigve Simonsen AS", from: "owner", license: OWN,
  },
  sniksfjorden: {
    key: "sniksfjorden",
    src: "/img/commons-sniksfjorden.jpg", w: 1600, h: 1067,
    alt: { no: "Sniksfjorden sett fra høyden ved Snig, ut mot havet", en: "Sniksfjorden seen from the height at Snig, out towards the sea" },
    caption: { no: "Sniksfjorden sett fra høyden ved Snig, med åpent hav i enden av fjorden", en: "Sniksfjorden seen from the height at Snig, with open sea at the end of the fjord" },
    by: "Rolfsteinar", from: "commons", license: same("CC BY-SA 3.0"),
    url: "https://commons.wikimedia.org/wiki/File:Sniksfjorden-20091018.jpg",
  },
  snig: {
    key: "snig",
    src: "/img/commons-snig.jpg", w: 2200, h: 1179,
    alt: { no: "Snig ved Sniksfjorden, der Audna renner ut", en: "Snig on Sniksfjorden, where the Audna flows out" },
    caption: { no: "Snig ved Sniksfjorden, der Audna renner ut i fjorden", en: "Snig on Sniksfjorden, where the Audna flows into the fjord" },
    by: "Bjoertvedt", from: "commons", license: same("CC BY-SA 3.0"),
    url: "https://commons.wikimedia.org/wiki/File:Lindesnes_Snig_IMG_1118.JPG",
  },
  vigeland: {
    key: "vigeland",
    src: "/img/commons-vigeland-floyheia.jpg", w: 2200, h: 1467,
    alt: { no: "Vigeland sett fra Fløyheia, med Audna gjennom sentrum", en: "Vigeland seen from Fløyheia, with the Audna through the centre" },
    caption: { no: "Vigeland sett fra Fløyheia, med Audna gjennom sentrum", en: "Vigeland seen from Fløyheia, with the Audna through the centre" },
    by: "Rolfsteinar", from: "commons", license: same("CC BY-SA 3.0"),
    url: "https://commons.wikimedia.org/wiki/File:130310-1601_-_Vigeland_i_Lindesnes_kommune,_fra_Fl%C3%B8yheia.jpg",
  },
  spangereid: {
    key: "spangereid",
    src: "/img/commons-spangereid.jpg", w: 2200, h: 1465,
    alt: { no: "Spangereid sett fra lufta, med fjorden, stranda og kanalen", en: "Spangereid from the air, with the fjord, the beach and the canal" },
    caption: { no: "Spangereid fra lufta, vest for Knotten langs fylkesvei 460", en: "Spangereid from the air, west of Knotten along county road 460" },
    by: "Flums", from: "commons", license: same("CC BY-SA 4.0"),
    url: "https://commons.wikimedia.org/wiki/File:Spangereid_fra_lufta.jpg",
  },
  audna: {
    key: "audna",
    src: "/img/commons-audna-outlet.jpg", w: 2200, h: 875,
    alt: { no: "Audna elvas utløp, et naturreservat", en: "The mouth of the Audna, a nature reserve" },
    caption: { no: "Audna elvas utløp, naturreservat", en: "The mouth of the Audna, a nature reserve" },
    by: "Bjoertvedt", from: "commons", license: same("CC BY-SA 3.0"),
    url: "https://commons.wikimedia.org/wiki/File:Lindesnes_Audna_outlet_IMG_1342_nature_reserve.JPG",
  },
};

/** The project owner's photos of the view, in the order the pages show them. */
export const VIEW_PHOTOS: PhotoKey[] = ["view", "view2", "viewWide", "summer"];
/** The photos of the area from Wikimedia Commons, from the fjord inland. */
export const AREA_PHOTOS: PhotoKey[] = ["sniksfjorden", "spangereid", "vigeland", "snig", "audna"];

/** "Rolfsteinar, Wikimedia Commons", or the company for the owner's own photos. */
export function photoCredit(p: SharedPhoto): string {
  return p.from === "commons" ? `${p.by}, Wikimedia Commons` : p.by;
}

/** One photo in one language, in the shape the Klassisk pages have always read (src/lib/klassisk/photos.ts). */
export type LocalPhoto = { src: string; w: number; h: number; alt: string; caption: string; credit: string; license: string; url?: string };

export function photoIn(key: PhotoKey, lang: Lang): LocalPhoto {
  const p = PHOTO[key];
  return { src: p.src, w: p.w, h: p.h, alt: p.alt[lang], caption: p.caption[lang], credit: photoCredit(p), license: p.license[lang], ...(p.url ? { url: p.url } : {}) };
}

/** Every photo in one language, keyed as above. */
export function photosIn(lang: Lang): Record<PhotoKey, LocalPhoto> {
  return Object.fromEntries((Object.keys(PHOTO) as PhotoKey[]).map((k) => [k, photoIn(k, lang)])) as Record<PhotoKey, LocalPhoto>;
}
