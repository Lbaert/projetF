import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FIST // La Fistinière',
  description: 'Collective highlight voting platform - Hell Let Loose',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#0a0a0a] text-[#e5e2e1] min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}