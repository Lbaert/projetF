import './globals.css'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'FIST - Fistinière Highlight',
  description: 'Collective voting platform for Fist Discord',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-[#1A1A1A] text-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}