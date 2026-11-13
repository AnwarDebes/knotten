import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
/** Cloudflare Turnstile, the spam check on the public forms (components/Turnstile.tsx): its script and its frame. */
const TURNSTILE = "https://challenges.cloudflare.com";

/**
 * What a page may load, and from where. Everything comes from the site itself, except Turnstile. No nonces, so the
 * pages stay static: the App Router's own inline scripts need 'unsafe-inline'. 'wasm-unsafe-eval' lets the 3D
 * model loader's geometry decoders compile their WebAssembly (meshopt on every 3D page; Draco when a model uses it);
 * it allows WebAssembly only, never eval. Workers are the site's own scripts (the energy simulator, the terrain);
 * blob: is the loader's own way of starting the Draco decoder and of unpacking textures packed inside a model. No
 * other site may frame a page, and forms post only to the site. `next dev` also needs eval and its live-reload socket.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${TURNSTILE}${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  `connect-src 'self' blob:${dev ? " ws: wss:" : ""}`,
  `frame-src ${TURNSTILE}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join("; ");

/**
 * Device features the site never uses, switched off for every page and anything it frames. Copying a link to the
 * clipboard and playing the muted fly-in film stay as browsers allow by default.
 */
const permissionsPolicy = [
  "accelerometer=()", "bluetooth=()", "camera=()", "display-capture=()", "encrypted-media=()", "geolocation=()", "gyroscope=()",
  "hid=()", "idle-detection=()", "magnetometer=()", "microphone=()", "midi=()", "payment=()", "publickey-credentials-get=()",
  "screen-wake-lock=()", "serial=()", "usb=()", "xr-spatial-tracking=()",
].join(", ");

/** Sent with every response: the policy above, no framing by other sites, no MIME sniffing, a careful referrer, https only. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // the floating "N" badge in dev confused reviewers; it never ships to production anyway
  devIndicators: false,
  poweredByHeader: false,
  // next dev must not write tool instruction files into the project
  agentRules: false,
  turbopack: { root: __dirname },
  // the Klassisk design serves its photos and maps through next/image, at the qualities its pages ask
  // for (Next 16 allows only 75 unless they are listed, and quietly lowers the rest)
  images: { formats: ["image/avif", "image/webp"], qualities: [75, 80, 85, 88, 90, 92] },
  experimental: {
    // two root layouts (one per design) need a 404 of their own: src/app/global-not-found.tsx
    globalNotFound: true,
    // every server action, the public login and sign-up forms among them, takes at most 1 MB (Next's default, set
    // here so it stays): uploads go to route handlers with their own limits (POST /api/files, /api/energy/readings)
    serverActions: { bodySizeLimit: "1mb" },
  },
  // the server reads only public/data at run time: the 3D, the images and the documents stay out of the server
  // bundles, and so do the private records (password hashes, the session secret, uploads), whatever is on disk
  outputFileTracingExcludes: {
    "/*": ["./data/private/**/*", "./data/leads.json", "./public/twin/**/*", "./public/renders/**/*", "./public/img/**/*", "./public/assets/**/*", "./public/docs/**/*", "./public/draco/**/*", "./public/models/**/*"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // the 3D model's data (13 MB, some 35 files): the browser keeps its copy but asks the server before each use, so
      // every visit gets the model as last published. A file that has not changed is answered "not modified" and is
      // not downloaded again. twin.json lists the other files, so all of them are checked, never twin.json alone:
      // a new twin.json beside an older texture from the cache would not match.
      { source: "/twin/:path*", headers: [{ key: "Cache-Control", value: "public, no-cache" }] },
      // the pictures: kept by the browser and refreshed in the background (a change reaches everyone within a day)
      { source: "/(renders|assets|img)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=2592000" }] },
    ];
  },
};

export default nextConfig;
