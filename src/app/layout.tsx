import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ConvexClientProvider } from "./ConvexClientProvider"
import { OrgProvisioner } from "./OrgProvisioner"
import { Toaster } from "sonner"
import "./globals.css"

export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1C1A18",
}

export const metadata: Metadata = {
  title: {
    default: "Kranely — Piattaforma Gestionale per Serramentisti",
    template: "%s | Kranely",
  },
  description: "Gestisci preventivi, fornitori, cantieri e pagamenti in un unico posto",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kranely.it"),
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kranely",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "Kranely",
    title: "Kranely — Piattaforma Gestionale per Serramentisti",
    description: "Gestisci preventivi, fornitori, cantieri e pagamenti in un unico posto",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kranely — Piattaforma Gestionale per Serramentisti",
    description: "Gestisci preventivi, fornitori, cantieri e pagamenti in un unico posto",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://hushed-kiwi-35.convex.cloud" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://hushed-kiwi-35.convex.cloud" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-kranely-app-bg text-white antialiased`}>
        <a href="#main-content" className="skip-link">Salta al contenuto principale</a>
        <ConvexClientProvider>
          <OrgProvisioner>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                  style: {
                    background: "#2a2826",
                    color: "#F0EBE8",
                    border: "1px solid #535252",
                  },
                }}
              />
            </AuthProvider>
          </OrgProvisioner>
        </ConvexClientProvider>
      </body>
    </html>
  )
}