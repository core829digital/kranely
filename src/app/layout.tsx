import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ConvexClientProvider } from "./ConvexClientProvider"
import { OrgProvisioner } from "./OrgProvisioner"
import { Toaster } from "sonner"
import "./globals.css"

export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kranely — Piattaforma Gestionale per Serramentisti",
  description: "Gestisci preventivi, fornitori, cantieri e pagamenti in un unico posto",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} bg-kranely-app-bg text-white antialiased`}>
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
