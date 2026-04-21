'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, canUpload } = useAuth()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

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
        <div className="flex items-center gap-2 ml-4 border-l border-[#4A4A4A] pl-4">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#4A4A4A] flex items-center justify-center text-sm">
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="font-bold text-[#C9A227] text-sm">{user.username}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-[#8B0000] hover:bg-[#6B0000] rounded transition-colors ml-2"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}