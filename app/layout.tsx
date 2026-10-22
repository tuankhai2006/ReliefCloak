import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { TideProvider } from '@/lib/tide'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'ReliefCloak',
  description: 'Giải ngân cứu trợ thiên tai không ai có thể đơn phương can thiệp',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <TideProvider>
          <NavBar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </TideProvider>
      </body>
    </html>
  )
}
