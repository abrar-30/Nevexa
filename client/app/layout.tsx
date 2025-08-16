import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { MessageProvider } from "@/contexts/message-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nevexa - Social Media Platform",
  description: "Connect with people around the world",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <MessageProvider>
            {children}
            <Toaster />
          </MessageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
