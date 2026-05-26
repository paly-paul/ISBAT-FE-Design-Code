import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISBAT University ERP',
  description: 'Enterprise Resource Planning — Academic Module',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.lineicons.com/4.0/lineicons.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
