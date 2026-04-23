'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, canUpload, isAdmin } = useAuth()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return null

  return (
    <header className="bg-black text-[#bbf600] border-b-2 border-[#bbf600]/30 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 py-4">
        <Link href="/feed" className="text-2xl font-black text-[#bbf600] tracking-tighter italic font-['Space_Grotesk'] uppercase">
          VOTE_TERMINAL
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6 font-['Space_Grotesk'] text-xs font-medium uppercase">
            <Link href="/feed" className="text-[#bbf600] border-b-2 border-[#bbf600] px-2 py-1">Frontline</Link>
            {canUpload && (
              <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-[#bbf600]/10 px-2 py-1 transition-all">Terminal</Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-zinc-500 hover:text-white hover:bg-[#bbf600]/10 px-2 py-1 transition-all">War Room</Link>
            )}
            <Link href="/account" className="text-zinc-500 hover:text-white hover:bg-[#bbf600]/10 px-2 py-1 transition-all">Profile</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-zinc-800 border border-[#bbf600]/50 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover grayscale brightness-75" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-['Space_Grotesk'] text-xs font-bold text-[#bbf600]">{user.username?.toUpperCase()}</span>
            <span className="font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest">{user.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-['Space_Grotesk'] font-bold uppercase bg-[#bbf600] text-black hover:bg-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}