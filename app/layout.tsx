import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { TideProvider } from '@/lib/tide'
import { LanguageProvider } from '@/lib/i18n'
import NavBar from '@/components/NavBar'
import { DemoBanner, Footer } from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'ReliefCloak',
  description: 'Cứu trợ thiên tai minh bạch, không ai có thể đơn phương giải ngân',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <LanguageProvider>
          <TideProvider>
            <DemoBanner />
            <NavBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
            <Footer />
          </TideProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
