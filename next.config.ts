import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Static security headers for every response (NFR-SEC-002/005).
 * The CSP is per request (nonce), so it is set in src/proxy.ts instead.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // HSTS only in production: on localhost it would pin http://localhost to HTTPS.
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Every route renders per request on purpose (CSP nonce, ADR-008), so checking each page
    // for an instant static shell only produces noise. Validate only segments that opt in.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // Pin the project root. Without it, a stray package-lock.json in a parent
    // folder (e.g. the home directory) makes Turbopack guess the wrong root.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
