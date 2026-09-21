import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { siteConfig } from "@/config/site"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  metadataBase: new URL(siteConfig.url),
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-page grow px-6 py-8 md:px-12">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
