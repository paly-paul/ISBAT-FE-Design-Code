import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'ISBAT University – Academic Portal',
  description: 'Academic ERP for ISBAT University students and faculty',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const deviceType = headersList.get('x-device-type') ?? 'desktop'

  return (
    <html lang="en" data-device={deviceType}>
      <body className="min-h-screen bg-[#2d448f] font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
