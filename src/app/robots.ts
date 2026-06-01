import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kranely.it"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/dashboard/",
          "/admin/",
          "/settings/",
          "/profile/",
          "/clients/",
          "/suppliers/",
          "/quotes/",
          "/payments/",
          "/messages/",
          "/documents/",
          "/storage/",
          "/tasks/",
          "/appointments/",
          "/activity-log/",
          "/conversations/",
          "/daily-logs/",
          "/blog-admin/",
          "/seed/",
          "/onboarding/",
          "/my-appointments/",
          "/company-dashboard/",
          "/client-dashboard/",
          "/supplier-dashboard/",
          "/collaborator-dashboard/",
          "/driver-dashboard/",
          "/shared-documents/",
          "/private-area/",
          "/whitelabel/",
          "/referral/",
          "/workflow/",
          "/cantieri/",
          "/collaborators/",
          "/certificates/",
          "/pdf-editor/",
          "/public-pricing",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
