import type { Lang, T } from "@/lib/facts";
import { PHOTOS } from "@/lib/klassisk/photos";

/**
 * Every dataset, map and photo the website and its 3D model are built from, with the licence it is used under.
 * One list for both designs (the footers show it). Where the terms are not settled yet, the entry says so.
 */
export type Credit = { id: string; who: T; what: T; licence: T; url?: string; licenceUrl?: string };

const CC_BY = "https://creativecommons.org/licenses/by/4.0/";
const NLOD = "https://data.norge.no/nlod/no/2.0";
const PENDING: T = { no: "vilkår avklares", en: "terms to be confirmed" };

export const CREDITS: Credit[] = [
  {
    id: "kartverket",
    who: { no: "Kartverket", en: "Kartverket (Norwegian Mapping Authority)" },
    what: { no: "terreng og overflate fra laserdata (hoydedata.no), stedsnavn, Matrikkelen, sjøkart og Norgeskart", en: "terrain and surface from laser data (hoydedata.no), place names, the land register, nautical charts and Norgeskart" },
    licence: { no: "CC BY 4.0", en: "CC BY 4.0" },
    url: "https://www.kartverket.no/",
    licenceUrl: CC_BY,
  },
  {
    id: "nvdb",
    who: { no: "Statens vegvesen, NVDB", en: "Norwegian Public Roads Administration, NVDB" },
    what: { no: "veinettet og utstyret langs veiene", en: "the road network and the road furniture" },
    licence: { no: "NLOD 2.0", en: "NLOD 2.0" },
    url: "https://www.vegvesen.no/",
    licenceUrl: NLOD,
  },
  {
    id: "nve",
    who: { no: "NVE", en: "NVE (Norwegian Water Resources and Energy Directorate)" },
    what: { no: "kraftledninger og master", en: "power lines and masts" },
    licence: { no: "NLOD", en: "NLOD" },
    url: "https://www.nve.no/",
    licenceUrl: NLOD,
  },
  {
    id: "nibio-sr16",
    who: { no: "NIBIO, SR16", en: "NIBIO, SR16" },
    what: { no: "treslag i skogen", en: "tree species in the forest" },
    licence: { no: "NLOD", en: "NLOD" },
    url: "https://www.nibio.no/",
    licenceUrl: NLOD,
  },
  {
    id: "nibio-ar5",
    who: { no: "NIBIO, AR5", en: "NIBIO, AR5" },
    what: { no: "arealtyper og skogtyper", en: "land and forest types" },
    licence: PENDING,
    url: "https://www.nibio.no/",
  },
  {
    id: "esri",
    who: { no: "Esri World Imagery", en: "Esri World Imagery" },
    what: { no: "flyfoto på terrenget i 3D-modellen", en: "aerial imagery on the terrain of the 3D model" },
    licence: { no: "Esris vilkår", en: "Esri's terms" },
    url: "https://www.esri.com/",
  },
  {
    id: "pvgis",
    who: { no: "EU-kommisjonen, Joint Research Centre: PVGIS", en: "European Commission, Joint Research Centre: PVGIS" },
    what: { no: "et typisk værår for Knotten og solproduksjonen det gir", en: "a typical weather year for Knotten and the solar yield it gives" },
    licence: { no: "gjenbruk med kildehenvisning", en: "reuse with acknowledgement" },
    url: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en",
  },
  {
    id: "osm",
    who: { no: "OpenStreetMap-bidragsytere", en: "OpenStreetMap contributors" },
    what: { no: "bygg, veier, vann og arealbruk rundt feltet", en: "buildings, roads, water and land use around the field" },
    licence: { no: "ODbL", en: "ODbL" },
    url: "https://www.openstreetmap.org/copyright",
    licenceUrl: "https://opendatacommons.org/licenses/odbl/",
  },
  {
    id: "terrain-tiles",
    who: { no: "AWS Terrain Tiles (Mapzen)", en: "AWS Terrain Tiles (Mapzen)" },
    what: { no: "horisonten langt unna, for sol og sikt", en: "the far horizon, for sun and view" },
    licence: { no: "åpne høydedata fra flere kilder", en: "open elevation data from several sources" },
    url: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
  },
  {
    id: "met",
    who: { no: "Meteorologisk institutt", en: "Norwegian Meteorological Institute" },
    what: { no: "været nå, i Knotten AI og portalen", en: "the weather now, in Knotten AI and the portal" },
    licence: { no: "NLOD 2.0 og CC BY 4.0", en: "NLOD 2.0 and CC BY 4.0" },
    url: "https://api.met.no/",
    licenceUrl: CC_BY,
  },
  {
    id: "prices",
    who: { no: "Nord Pool, via hvakosterstrommen.no", en: "Nord Pool, via hvakosterstrommen.no" },
    what: { no: "strømprisene time for time i NO2", en: "the hourly power prices in NO2" },
    licence: PENDING,
    url: "https://www.hvakosterstrommen.no/",
  },
  {
    id: "elhub",
    who: { no: "Elhub", en: "Elhub" },
    what: { no: "forbruksprofilen for husholdninger i NO2", en: "the consumption profile of households in NO2" },
    licence: PENDING,
    url: "https://elhub.no/",
  },
  {
    id: "norkart",
    who: { no: "Norkart", en: "Norkart" },
    what: { no: "kartene prosjekteier har delt", en: "the maps the project owner has shared" },
    licence: { no: "brukt med prosjekteiers kart", en: "used with the project owner's maps" },
  },
];

/** The photographers on Wikimedia Commons whose photos the site shows, each with the licence of the photo. */
export function commonsPhotographers(): { name: string; licence: string; urls: string[] }[] {
  const by = new Map<string, { name: string; licence: string; urls: string[] }>();
  for (const p of Object.values(PHOTOS)) {
    if (!p.credit.includes("Wikimedia Commons")) continue;
    const name = p.credit.replace(/,?\s*Wikimedia Commons$/, "");
    const key = `${name}|${p.license}`;
    const e = by.get(key) ?? { name, licence: p.license, urls: [] };
    if (p.url) e.urls.push(p.url);
    by.set(key, e);
  }
  return [...by.values()];
}

/** The Wikimedia Commons entry, built from the photo list so a new photo is credited by itself. */
export function commonsCredit(): Credit {
  const people = commonsPhotographers();
  const names = people.map((p) => `${p.name} (${p.licence})`).join(", ");
  return {
    id: "commons",
    who: { no: "Wikimedia Commons", en: "Wikimedia Commons" },
    what: { no: `bilder fra området, tatt av ${names}`, en: `photos of the area, taken by ${names}` },
    licence: { no: "CC BY-SA", en: "CC BY-SA" },
    url: "https://commons.wikimedia.org/",
  };
}

export function allCredits(): Credit[] {
  return [...CREDITS, commonsCredit()];
}

/** The short form for a footer line: "Kartverket (CC BY 4.0), Statens vegvesen, NVDB (NLOD 2.0), ...". */
export function creditsLine(lang: Lang): string {
  const short = ["kartverket", "nvdb", "nve", "nibio-sr16", "esri", "pvgis", "osm", "commons"];
  const list = allCredits().filter((c) => short.includes(c.id));
  const nibio = lang === "no" ? "NIBIO (SR16 NLOD, AR5 vilkår avklares)" : "NIBIO (SR16 NLOD, AR5 terms to be confirmed)";
  return list.map((c) => (c.id === "nibio-sr16" ? nibio : c.id === "pvgis" ? "EU PVGIS" : `${c.who[lang]} (${c.licence[lang]})`)).join(", ");
}
