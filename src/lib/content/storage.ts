import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Image storage for content slots. Type and size are checked, and the bytes are
 * sniffed against a small signature allowlist so a mislabelled file is rejected.
 *
 * In development the file is written under public/uploads (served statically and
 * gitignored). In production set UPLOAD_DIR to a mounted EU volume, or swap this
 * adapter for an EU object-storage client; the call site and return shape stay
 * the same. See HANDOVER.md.
 */

const MAX_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { ext: string; type: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    type: "image/png",
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "webp",
    type: "image/webp",
    test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
];

export type SaveResult = { ok: true; ref: string } | { ok: false; error: string };

export async function saveImage(file: File | null): Promise<SaveResult> {
  if (!file || file.size === 0) return { ok: false, error: "empty" };
  if (file.size > MAX_BYTES) return { ok: false, error: "too-large" };
  const buf = Buffer.from(await file.arrayBuffer());
  const match = SIGNATURES.find((s) => s.test(buf));
  if (!match) return { ok: false, error: "type" };

  const name = `${randomBytes(8).toString("hex")}.${match.ext}`;
  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { ok: true, ref: `/uploads/${name}` };
}
