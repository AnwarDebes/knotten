// Generate the concept deliverables for Sigve Simonsen AS into
// public/deliverables. Plain Norwegian, every figure indicative and sourced,
// consistent with the site and the shared calculation modules. Run:
//   node scripts/build-deliverables.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const OUT = path.join(process.cwd(), "public", "deliverables");

// Indicative figures, each mirroring a site module or research note. These are
// the same numbers used across the site, so the documents do not diverge.
const F = {
  passivhusHeating: "om lag 15 kWh/m2 per ar (netto oppvarming, NS 3700-niva)",
  airtightness: "n50 om lag 0,6 luftvekslinger per time ved 50 Pa",
  pvYield: "om lag 1000 til 1020 kWh per kWp per ar (PVGIS, sorvendt)",
  ssbBaseline: "om lag 14 700 kWh per ar (SSB-snitt for husholdning, 2024)",
  stotte:
    "ordinaer stromstotte dekker 90 prosent av spot over 77 ore/kWh eks. mva. (96,25 inkl.), opptil 5 000 kWh/maned, vedtatt ut 31. desember 2029",
  norgespris: "Norgespris er fast 50 ore/kWh inkl. mva. (40 i nord), bundet ut 2026",
  energideling:
    "energideling pa samme eiendom siden 1. oktober 2023, inntil 1 MW (AC) per eiendom; utvidet til naeringsomrade fra 1. januar 2026",
  plusskunde:
    "plusskunde betaler verken nettleie eller avgifter pa egenprodusert stromm brukt selv, og kan mate inntil 100 kW ut",
  zone: "Rodberg ligger i prisomrade NO2, historisk blant Norges hoyeste og mest volatile",
  location:
    "Rodberg ved Sniksfjorden i Lindesnes, ved utlopet av Audna, om lag 4 km sor for Vigeland",
};

const FORBEHOLD =
  "Forbehold: Alle tall er indikative estimater (per juni 2026) og krever profesjonell verifikasjon. Antall tomter, priser, storrelser og fremdrift oppgis nar reguleringen er klar. Dette er ikke et tilbud.";

const SOURCES = [
  "PVGIS (Photovoltaic Geographical Information System), solinnstraling.",
  "SSB, husholdningenes energibruk.",
  "regjeringen.no og NVE, stromstotte og Norgespris (kontrollert juni 2026).",
  "NVE, plusskunde og energideling.",
  "Kartverket Hoydedata (terreng, CC BY 4.0).",
  "NS 3700 (passivhus) og NS 3720 (klimagassberegninger).",
];

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { after: 160, before: 200 } });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, italics: opts.italics })],
    spacing: { after: 120 },
  });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}

function docTitle(title, subtitle) {
  return [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
    para(subtitle),
    para(FORBEHOLD, { italics: true }),
  ];
}

function sourcesSection() {
  return [heading("Kilder", HeadingLevel.HEADING_2), ...SOURCES.map(bullet)];
}

async function saveDocx(name, children) {
  const doc = new Document({ sections: [{ children }] });
  const buf = await Packer.toBuffer(doc);
  await writeFile(path.join(OUT, name), buf);
  return name;
}

// --- Energikonsept ---------------------------------------------------------
async function energikonsept() {
  return saveDocx("Energikonsept_Knotten.docx", [
    ...docTitle(
      "Energikonsept Knotten",
      "Et helhetlig energikonsept for et energismart boligomrade pa Rodberg ved Sniksfjorden, Lindesnes.",
    ),
    heading("Bakgrunn"),
    para(`${F.location}. ${F.zone}.`),
    heading("Lavt energibehov i bunn"),
    para(
      `Boligene planlegges mot passivhusniva, med ${F.passivhusHeating}, tett klimaskjerm (${F.airtightness}) og balansert ventilasjon med varmegjenvinning.`,
    ),
    heading("Lokal produksjon"),
    para(
      `Solceller gir ${F.pvYield} pa tomtene. Smaskala vind og geotermisk varme vurderes der det egner seg.`,
    ),
    heading("Lagring og deling"),
    para(
      "Konseptet kombinerer batterilagring med en delt energibase for termisk lagring (referanse: Polar Night Energy, sandbatteri). En felles energihub binder produksjon, lagring og forbruk sammen.",
    ),
    para(`${F.energideling}. ${F.plusskunde}.`),
    heading("Robusthet"),
    para(
      "Med batteri og solceller kan boligen holde kritiske laster (varme, kjol/frys, lys) gaende ved strombrudd. Backup-timer beregnes av brukbar batterikapasitet delt pa kritisk last, som i kalkulatoren pa nettstedet.",
    ),
    heading("V2G og V2H"),
    para(
      "Toveis lading (elbil til hus eller nett) inngar i tankegangen, men er fortsatt en teknologi i utvikling og presenteres som mulighet, ikke som vedtatt losning.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Mulighetsstudier ------------------------------------------------------
async function mulighetsstudier() {
  const options = [
    [
      "Solenergi",
      `Solceller pa tak og eventuelt fasade. Utbytte ${F.pvYield}. Forutsetning: takflate og orientering per boligtype. Verifiseres med PVGIS-beregning og takprosjektering.`,
    ],
    [
      "Vind",
      "Smaskala vind vurderes som supplement der vindforhold og hensyn til naboer og landskap tillater det. Krever stedlig vindmaling og konsesjonsvurdering for konklusjon.",
    ],
    [
      "Geotermi",
      "Bergvarme/grunnvarme med varmepumpe kan dekke oppvarming. Forutsetter geologisk vurdering og borehullsdimensjonering. Verifiseres med termisk responstest.",
    ],
    [
      "Lagring",
      "Batteri (el) og termisk lagring (sandbatteri) jevner ut produksjon og forbruk over dogn og ar. Dimensjon avhenger av antall boliger og forbruksprofil; verifiseres mot malte profiler.",
    ],
    [
      "Delt energibase og energideling",
      `${F.energideling}. Eier- og driftsmodell er under utredning og avklares for salgsstart.`,
    ],
    [
      "V2G og V2H",
      "Toveis lading kan gi ekstra fleksibilitet og backup. Teknologi og standardisering er umoden; behandles som opsjon inntil utstyr og nettselskap stotter det.",
    ],
  ];
  const children = [
    ...docTitle(
      "Mulighetsstudier Knotten",
      "Korte mulighetsstudier per energialternativ, med forutsetninger, kilder og verifikasjonsnotat.",
    ),
  ];
  for (const [title, body] of options) {
    children.push(
      heading(title, HeadingLevel.HEADING_2),
      para(body),
      para("Verifikasjonsnotat: kreves profesjonell prosjektering for endelig konklusjon.", {
        italics: true,
      }),
    );
  }
  children.push(...sourcesSection());
  return saveDocx("Mulighetsstudier_Knotten.docx", children);
}

// --- Reguleringsplan -------------------------------------------------------
async function reguleringsplan() {
  return saveDocx("Reguleringsplan_anbefalinger_Knotten.docx", [
    ...docTitle(
      "Reguleringsplan: anbefalinger",
      "Energi- og infrastrukturrelevante innspill til reguleringsprosessen.",
    ),
    heading("Anbefalinger"),
    bullet(
      "Sett av areal og foringer for felles energibase, batteri og teknisk rom tidlig i planen.",
    ),
    bullet(
      "Legg til rette for solceller gjennom takvinkel, orientering og hoyder som ikke skygger nabotomter.",
    ),
    bullet(
      "Planlegg intern distribusjon for energideling pa eiendommen (inntil 1 MW AC), med plass til malere og vern.",
    ),
    bullet("Vurder ladeinfrastruktur og toveis lading i parkeringslosningen."),
    bullet("Ivareta sjoutsikt, kantsoner mot Audna og turdrag i plankartet."),
    para(
      "Innspillene er indikative og ma samordnes med kommunens planavdeling, netteier (Glitre Nett) og fagkyndige.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Robusthet og beredskap ------------------------------------------------
async function robusthet() {
  return saveDocx("Robusthet_og_beredskap_Knotten.docx", [
    ...docTitle(
      "Robusthet og beredskap",
      "Hvorfor energismarte boliger her er mer robuste ved strombrudd og prissvingninger.",
    ),
    heading("Strombrudd"),
    para(
      "Kystnaere Agder ser vaerdrevne strombrudd. Med solceller og batteri kan en bolig holde kritiske laster gaende: varmepumpe, kjol/frys, belysning, pumpe og ruter. Solladning om dagen forlenger varigheten, mest om sommeren.",
    ),
    heading("Prisrobusthet"),
    para(
      `${F.zone}. ${F.stotte}. ${F.norgespris}. Egenprodusert og selvforbrukt stromm unngar spot, nettleie og avgifter, og reduserer eksponeringen mot pristopper.`,
    ),
    heading("Forutsetninger"),
    para(
      "Backup-timer og prisscenarier er indikative og bruker samme modeller som verktoyene pa nettstedet. Reelt varmebehov, batteriprodukt og apparatpark verifiseres for bygging.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Markedsstrategi og prospekt -------------------------------------------
async function markedsstrategi() {
  return saveDocx("Markedsstrategi_og_prospekt_Knotten.docx", [
    ...docTitle(
      "Markedsstrategi og prospekt",
      "Hvordan prosjektet posisjoneres og selges, og innhold til prospektet.",
    ),
    heading("Posisjonering"),
    para(
      "Knotten posisjoneres som et nasjonalt referanseprosjekt for energismarte, robuste boliger med sjoutsikt. Budskapet er uavhengighet og redusert eksponering, ikke garanterte besparelser.",
    ),
    heading("Malgrupper"),
    bullet("Boligkjopere som velger etter manedskostnad og trygghet."),
    bullet("Lindesnes kommune og partnere som soker forbildeprosjekt."),
    bullet("Lokalpresse og fagmiljo for synlighet."),
    heading("Kanaler og kampanje"),
    para(
      "Nettstedet med verktoy (energi, stromtrygghet, manedskostnad, sol, naromrade, strombrudd, konfigurator, CO2) er navet. Interessenter melder uforpliktende interesse for salgsstart. Cookieless analyse (Plausible) maler interesse uten sporing.",
    ),
    heading("Prospektinnhold (utkast)"),
    para(
      "Beliggenhet og sjoutsikt; energikonsept og plusskunde; indikativ manedskostnad mot vanlig bolig; fremdrift og forbehold. Tall hentes fra Energimodell_Knotten.xlsx og er konsistente med nettstedet.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Non-technical overview ------------------------------------------------
async function oversikt() {
  return saveDocx("Oversikt_for_Sigve_Simonsen_AS.docx", [
    ...docTitle(
      "Oversikt for Sigve Simonsen AS",
      "En kort, ikke-teknisk gjennomgang av hva som er levert og hvordan det henger sammen.",
    ),
    heading("Hva dette er"),
    para(
      "Et nettsted som viser ideen, et sett dokumenter du kan ta med i moter, og verktoy som lar kjopere se verdien selv. Alt deler de samme tallene.",
    ),
    heading("Dokumentene"),
    bullet("Energikonsept: den tekniske ideen i klartekst."),
    bullet("Mulighetsstudier: hvert energialternativ med forutsetninger og kilder."),
    bullet("Energimodell (Excel): juster antall boliger og design selv."),
    bullet("Reguleringsplan-anbefalinger: innspill til kommunen."),
    bullet("Robusthet og beredskap: hvorfor dette er tryggere boliger."),
    bullet("Markedsstrategi og prospekt: hvordan det selges."),
    bullet("Presentasjon: en enkel bunke til kommune og partnere."),
    bullet("Personvernerklaering: til juridisk gjennomgang."),
    heading("Viktig"),
    para(
      "Alle tall er indikative inntil reguleringen og oppmaling er klare. Energiberegninger bor verifiseres av fagfolk for de presenteres som endelige. Sjekk satser og regler pa nytt for publisering.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Privacy policy --------------------------------------------------------
async function personvern() {
  return saveDocx("Personvernerklaering_Knotten.docx", [
    ...docTitle(
      "Personvernerklaering (utkast)",
      "Utkast til personvernerklaering for interessepamelding pa Knotten. Til juridisk/DPO-gjennomgang for publisering.",
    ),
    heading("Behandlingsansvarlig"),
    para(
      "Sigve Simonsen AS (juridisk navn, organisasjonsnummer og kontaktpunkt fylles inn for publisering).",
    ),
    heading("Hva vi samler inn"),
    para(
      "Ved interessepamelding: navn, e-post og eventuelt telefonnummer, samt et samtykkerecord (eksakt tekst, versjon og tidspunkt). Ingen sporing av enkeltpersoner. Verktoyene samler ingen personopplysninger.",
    ),
    heading("Grunnlag og rettigheter"),
    para(
      "Behandlingen bygger pa samtykke (GDPR art. 6(1)(a)) med dobbel bekreftelse (double opt-in). Du kan trekke samtykket nar som helst via avmeldingslenken, og be om innsyn, dataportabilitet og sletting.",
    ),
    heading("Lagring og analyse"),
    para(
      "Data lagres i EU/EOS. Webanalyse er cookieless (Plausible) og behandler ingen personopplysninger, derfor ingen samtykkebanner. Se ogsa nettstedets personvernside.",
    ),
    ...sourcesSection(),
  ]);
}

// --- Energy model xlsx -----------------------------------------------------
async function energimodell() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sigve Simonsen AS";
  const ws = wb.addWorksheet("Energimodell");
  ws.columns = [
    { header: "Parameter", key: "p", width: 42 },
    { header: "Verdi", key: "v", width: 16 },
    { header: "Enhet", key: "u", width: 16 },
    { header: "Kilde/forbehold", key: "s", width: 50 },
  ];
  ws.getRow(1).font = { bold: true };
  const rows = [
    ["Oppvarmet areal (per bolig)", 140, "m2", "Indikativ; settes per boligtype"],
    ["Netto oppvarmingsbehov", 15, "kWh/m2/ar", "Passivhusniva, NS 3700 (indikativt)"],
    ["Husholdningsstrom", 6000, "kWh/ar", "Indikativ, SSB-niva"],
    ["Solcelleanlegg", 7, "kWp", "Indikativ; settes per boligtype"],
    ["Solutbytte", 1010, "kWh/kWp/ar", "PVGIS, sorvendt (indikativt)"],
    ["Antall boliger", 12, "stk", "PLASSHOLDER: ukjent inntil regulering"],
  ];
  rows.forEach((r) => ws.addRow({ p: r[0], v: r[1], u: r[2], s: r[3] }));
  // Computed rows with real formulas referencing the inputs.
  ws.addRow({});
  const head = ws.addRow({ p: "Beregnet (per bolig)", v: "", u: "", s: "" });
  head.font = { bold: true };
  ws.addRow({
    p: "Oppvarmingsstrom",
    v: { formula: "B2*B3" },
    u: "kWh/ar",
    s: "areal x spesifikt behov",
  });
  ws.addRow({
    p: "Energibehov totalt",
    v: { formula: "B2*B3+B4" },
    u: "kWh/ar",
    s: "oppvarming + husholdning",
  });
  ws.addRow({ p: "Solproduksjon", v: { formula: "B5*B6" }, u: "kWh/ar", s: "kWp x utbytte" });
  ws.addRow({
    p: "Selvforsyning (med batteri, 0,6)",
    v: { formula: "MIN(1, (B5*B6*0.6)/(B2*B3+B4))" },
    u: "andel",
    s: "selvforbruk 0,6 med batteri",
  });
  ws.addRow({});
  ws.addRow({ p: FORBEHOLD });
  await wb.xlsx.writeFile(path.join(OUT, "Energimodell_Knotten.xlsx"));
  return "Energimodell_Knotten.xlsx";
}

// --- Kommune/partner deck --------------------------------------------------
async function deck() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4", width: 11, height: 6.19 });
  pptx.layout = "A4";
  const NAVY = "0B2236";
  const slide = (title, lines, opts = {}) => {
    const s = pptx.addSlide();
    s.background = { color: opts.cover ? NAVY : "FFFFFF" };
    s.addText(title, {
      x: 0.6,
      y: 0.5,
      w: 9.8,
      h: 1,
      fontSize: opts.cover ? 32 : 24,
      bold: true,
      color: opts.cover ? "FFFFFF" : NAVY,
    });
    if (lines.length) {
      s.addText(
        lines.map((t) => ({
          text: t,
          options: {
            bullet: !opts.cover,
            color: opts.cover ? "E6EEF2" : "123A5E",
            fontSize: 16,
            paraSpaceAfter: 8,
          },
        })),
        { x: 0.7, y: 1.7, w: 9.6, h: 4 },
      );
    }
    return s;
  };
  slide(
    "Knotten ved Sniksfjorden",
    [
      "Energismart boligomrade pa Rodberg, Lindesnes",
      "Presentasjon for kommune og partnere",
      "Alle tall er indikative (juni 2026)",
    ],
    { cover: true },
  );
  slide("Ambisjon", [
    "Nasjonalt referanseprosjekt for energismarte, robuste boliger",
    "Planlagt fra forste spadetak: energi, infrastruktur og regulering sammen",
  ]);
  slide("Energikonsept", [
    "Passivhusniva: " + F.passivhusHeating,
    "Sol: " + F.pvYield,
    "Lagring og delt energibase",
    "Energideling og plusskunde",
  ]);
  slide("Robusthet og pris", [
    F.zone,
    "Mindre eksponert via sol, batteri og deling",
    "Backup ved strombrudd",
  ]);
  slide("Veien videre", [
    "For regulering og salgsstart",
    "Innspill til reguleringsplan klare",
    "Antall tomter og priser oppgis nar reguleringen er klar",
  ]);
  slide("Forbehold og kilder", [
    FORBEHOLD,
    "Kilder: PVGIS, SSB, NVE, regjeringen.no, Kartverket, NS 3700/3720",
  ]);
  const buf = await pptx.write({ outputType: "nodebuffer" });
  await writeFile(path.join(OUT, "Presentasjon_kommune_og_partnere_Knotten.pptx"), buf);
  return "Presentasjon_kommune_og_partnere_Knotten.pptx";
}

// --- One-pager PDF ---------------------------------------------------------
async function onePager() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.043, 0.133, 0.212);
  const sea = rgb(0.043, 0.392, 0.439);
  let y = 800;
  const line = (text, { size = 11, f = font, color = navy, gap = 16, x = 50 } = {}) => {
    page.drawText(text, { x, y, size, font: f, color });
    y -= gap;
  };
  line("Knotten ved Sniksfjorden", { size: 22, f: bold, color: sea, gap: 28 });
  line("Energismart boligomrade pa Rodberg, Lindesnes (NO2). Sammendrag pa en side.", {
    size: 11,
    gap: 24,
  });
  const sections = [
    ["Beliggenhet", F.location + "."],
    ["Lavt energibehov", "Passivhusniva: " + F.passivhusHeating + ", " + F.airtightness + "."],
    ["Lokal energi", "Sol: " + F.pvYield + ". Lagring, delt energibase og energideling."],
    ["Plusskunde", F.plusskunde + "."],
    ["Prisrobusthet", F.zone + ". " + F.stotte + "."],
    ["Norgespris", F.norgespris + "."],
  ];
  for (const [h, b] of sections) {
    line(h, { size: 13, f: bold, color: sea, gap: 18 });
    // wrap body at ~95 chars
    const words = b.split(" ");
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).length > 95) {
        line(cur, { gap: 15 });
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    }
    if (cur) line(cur, { gap: 20 });
  }
  y -= 6;
  line(FORBEHOLD, { size: 8.5, color: rgb(0.4, 0.4, 0.4), gap: 13 });
  line(
    "Kilder: PVGIS, SSB, NVE, regjeringen.no, Kartverket, NS 3700/3720 (kontrollert juni 2026).",
    { size: 8.5, color: rgb(0.4, 0.4, 0.4) },
  );
  const buf = await pdf.save();
  await writeFile(path.join(OUT, "Sammendrag_en_side_Knotten.pdf"), buf);
  return "Sammendrag_en_side_Knotten.pdf";
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const made = [];
  made.push(await energikonsept());
  made.push(await mulighetsstudier());
  made.push(await reguleringsplan());
  made.push(await robusthet());
  made.push(await markedsstrategi());
  made.push(await oversikt());
  made.push(await personvern());
  made.push(await energimodell());
  made.push(await deck());
  made.push(await onePager());
  // A manifest the download page reads.
  const fs = await import("node:fs/promises");
  const manifest = await Promise.all(
    made.map(async (name) => {
      const stat = await fs.stat(path.join(OUT, name));
      return { file: name, bytes: stat.size, ext: name.split(".").pop() };
    }),
  );
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${made.length} deliverables to ${OUT}`);
  for (const m of manifest) console.log(`  ${m.file} (${Math.round(m.bytes / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
