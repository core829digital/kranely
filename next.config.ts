import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/config.ts")

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "kranely.ams3.cdn.digitaloceanspaces.com" },
      { protocol: "https" as const, hostname: "kranely.s3.eu-west-1.amazonaws.com" },
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/public-pricing",
        destination: "/pricing",
      },
    ]
  },
}

export default withNextIntl(nextConfig)
