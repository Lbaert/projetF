'use client'

import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-[#4B5320] text-white font-bold rounded hover:bg-[#3a3f18] transition-colors"
    >
      Se connecter avec Discord
    </button>
  )
}