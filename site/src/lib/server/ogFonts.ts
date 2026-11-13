import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The typefaces of the two designs for the generated share images (next/og reads TrueType, not the web fonts the
 * pages load). Static instances of the same families the pages use, under the SIL Open Font License
 * (src/assets/fonts/OFL.txt). Read once per server process.
 */
type Font = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" | "italic" };

const file = async (p: string) => {
  const b = await readFile(p);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

let moderne: Promise<Font[]> | null = null;
let klassisk: Promise<Font[]> | null = null;

/** Moderne: Bricolage Grotesque for display, Geist for text. */
export function moderneFonts(): Promise<Font[]> {
  moderne ??= Promise.all([
    file(join(process.cwd(), "src/assets/fonts/BricolageGrotesque-SemiBold.ttf")).then((data): Font => ({ name: "Bricolage Grotesque", data, weight: 600, style: "normal" })),
    file(join(process.cwd(), "src/assets/fonts/Geist-Regular.ttf")).then((data): Font => ({ name: "Geist", data, weight: 400, style: "normal" })),
    file(join(process.cwd(), "src/assets/fonts/Geist-Medium.ttf")).then((data): Font => ({ name: "Geist", data, weight: 500, style: "normal" })),
  ]);
  return moderne;
}

/** Klassisk: Newsreader for headings, Figtree for text. */
export function klassiskFonts(): Promise<Font[]> {
  klassisk ??= Promise.all([
    file(join(process.cwd(), "src/assets/fonts/Newsreader-Light.ttf")).then((data): Font => ({ name: "Newsreader", data, weight: 300, style: "normal" })),
    file(join(process.cwd(), "src/assets/fonts/Newsreader-Italic.ttf")).then((data): Font => ({ name: "Newsreader", data, weight: 400, style: "italic" })),
    file(join(process.cwd(), "src/assets/fonts/Figtree-Regular.ttf")).then((data): Font => ({ name: "Figtree", data, weight: 400, style: "normal" })),
    file(join(process.cwd(), "src/assets/fonts/Figtree-Medium.ttf")).then((data): Font => ({ name: "Figtree", data, weight: 500, style: "normal" })),
  ]);
  return klassisk;
}
