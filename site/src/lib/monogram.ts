/**
 * The drawn portrait for someone without a photo: a small landscape of their own, made from their name, so the same
 * person always gets the same picture and no two look alike. Klassisk draws it as contour lines, like the terrain
 * map behind its pages (contourRings); Moderne as two ridges on the horizon (ridges). Plain numbers and SVG path
 * text in a 200 x 200 box, no React and no randomness at run time, so the server and the browser draw the same.
 */

/** A repeatable sequence of numbers in [0, 1) from a text (FNV-1a hash, then mulberry32). */
function sequence(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A smooth closed curve through the points (Catmull-Rom as cubic Béziers). */
function closedCurve(pts: [number, number][]): string {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d}Z`;
}

/** A smooth open curve through the points (Catmull-Rom, the ends held). */
function openCurve(pts: [number, number][]): string {
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

/**
 * Contour rings round a summit that sits off the middle, smallest first, like the lines on a terrain map. The rings
 * share one shape that drifts a little from ring to ring, as real contours do. The outer ones run past the edge of
 * the box; the monogram's round frame cuts them.
 */
export function contourRings(seed: string, rings = 6): { d: string; summit: [number, number] }[] {
  const rnd = sequence(`contours:${seed}`);
  const cx = 100 + (rnd() - 0.5) * 70;
  const cy = 100 + (rnd() - 0.5) * 70;
  const waves = [1, 2, 3].map((k) => ({ k, a: (0.16 / k) * (0.5 + rnd()), p: rnd() * Math.PI * 2 }));
  const out: { d: string; summit: [number, number] }[] = [];
  for (let i = 0; i < rings; i++) {
    const radius = 14 + i * 21;
    const drift = (rnd() - 0.5) * 0.5;
    const pts: [number, number][] = [];
    const N = 14;
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2;
      const f = 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.k * a + w.p + drift * w.k), 0);
      pts.push([cx + Math.cos(a) * radius * f, cy + Math.sin(a) * radius * f * 0.86]);
    }
    out.push({ d: closedCurve(pts), summit: [r1(cx), r1(cy)] });
  }
  return out;
}

/** Two ridges across the lower part of the box, the far one higher and calmer, each closed down to the bottom edge. */
export function ridges(seed: string): { far: string; near: string } {
  const rnd = sequence(`ridges:${seed}`);
  const line = (base: number, amp: number) => {
    const waves = [1, 2, 3].map((k) => ({ k, a: (amp / k) * (0.4 + rnd()), p: rnd() * Math.PI * 2 }));
    const pts: [number, number][] = [];
    for (let x = -10; x <= 210; x += 20) {
      const t = (x / 200) * Math.PI * 2;
      pts.push([x, base + waves.reduce((s, w) => s + w.a * Math.sin(w.k * t * 0.75 + w.p), 0)]);
    }
    return `${openCurve(pts)}L210 210L-10 210Z`;
  };
  return { far: line(138, 9), near: line(162, 12) };
}
