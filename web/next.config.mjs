/** @type {import('next').NextConfig} */

// Reinforce the privacy promise at the transport layer: no external connections,
// frames, or objects. Styles need 'unsafe-inline' (Tailwind/Next inject them);
// script-src stays tight ('unsafe-eval' only applies in dev via Next).
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  // The app is fully client-side, so it can also be exported as static files.
  // Uncomment to produce a static build for GitHub Pages / any static host:
  // output: 'export',
  eslint: {
    // Linting is run separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

