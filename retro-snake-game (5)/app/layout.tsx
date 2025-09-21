import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { NhostProvider } from "@/lib/nhost-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Retro Snake Game",
  description: "Classic Snake game with NFT minting and real-time leaderboard",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <NhostProvider>
            <AuthProvider>{children}</AuthProvider>
          </NhostProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
