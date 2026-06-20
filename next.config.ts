import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Ignored over http (local dev); enforced over https in production.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Public-site CSP. It locks down framing, base-uri and object/plugin embedding,
// and constrains sources to self plus the few license-clean third parties the
// site actually uses (Plausible analytics, OpenStreetMap tiles). Inline styles
// (Tailwind, next/font) and the small inline JSON-LD/analytics-init scripts
// require 'unsafe-inline' under static rendering; a nonce-based, no-inline CSP
// is a documented go-live hardening step (see docs/security/threat-model.md).
const publicCsp = [
  "default-src 'self'",
  "img-src 'self' data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  // The map library runs its tile decoder in a Web Worker created from a blob.
  "worker-src 'self' blob:",
  "connect-src 'self' https://plausible.io https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Database drivers must not be bundled (PGlite ships WASM and reads files at
  // runtime; postgres-js is a Node module). Load them as external packages.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Public pages (everything except the admin area, which sets its own
        // stricter CSP below) get the public CSP.
        source: "/:path((?!admin).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp }],
      },
      {
        // The admin area handles personal data: lock it down further and keep
        // it out of any cache. A strict CSP allows only same-origin resources.
        source: "/admin/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(withBundleAnalyzer(nextConfig));
