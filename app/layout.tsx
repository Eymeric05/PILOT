import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PILOT",
  description: "Gestion de budget mensuel partagé",
  manifest: "/manifest.json",
  themeColor: "#334155",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PILOT",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
