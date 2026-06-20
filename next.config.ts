import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Database drivers must not be bundled (PGlite ships WASM and reads files at
  // runtime; postgres-js is a Node module). Load them as external packages.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default withNextIntl(withBundleAnalyzer(nextConfig));
