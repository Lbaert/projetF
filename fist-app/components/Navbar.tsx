'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, canUpload } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-[#2A2A2A] border-b border-[#4A4A4A] px-6 py-3 flex items-center justify-between">
      <Link href="/feed" className="text-xl font-bold text-[#C9A227]">
        FIST
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/feed"
          className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
        >
          Feed
        </Link>
        <Link
          href="/account"
          className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
        >
          Compte
        </Link>
        {canUpload && (
          <Link
            href="/dashboard"
            className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  )
}