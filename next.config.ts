import createNextIntlPlugin from "next-intl/plugin"
import { withSentryConfig } from "@sentry/nextjs"

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/config.ts")

const isProduction = process.env.NODE_ENV === "production"

const convexHost = "hushed-kiwi-35.convex.cloud"
const convexSiteHost = "hushed-kiwi-35.convex.site"
const sentryHost = process.env.NEXT_PUBLIC_SENTRY_HOST || ""

const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io https://*.convex.cloud ${sentryHost ? `https://${sentryHost}` : ""}`.trim(),
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https: ${convexHost} ${convexSiteHost}`,
  `connect-src 'self' https://${convexHost} https://${convexSiteHost} wss://${convexHost} https://api.stripe.com https://*.sentry.io ${sentryHost ? `https://${sentryHost}` : ""}`.trim(),
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].filter(Boolean)

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: isProduction,
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: convexHost },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ]
  },
  async rewrites() {
    return [{ source: "/public-pricing", destination: "/pricing" }]
  },
}

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  disableLogger: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
}

const configToExport = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withNextIntl(nextConfig), sentryOptions)
  : withNextIntl(nextConfig)

export default configToExport
