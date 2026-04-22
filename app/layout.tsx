import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: 'SlotZero - Real-Time Token Monitor',
  description: 'Monitor real-time token movements on Solana with instant anomaly detection. SlotZero provides live trading data and market intelligence.',
  generator: 'v0.app',
}

import { ClerkProvider } from '@clerk/nextjs'
import { SolanaAuthProvider } from '@/components/auth/solana-auth-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          <SolanaAuthProvider>
            {children}
            <Analytics />
          </SolanaAuthProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
