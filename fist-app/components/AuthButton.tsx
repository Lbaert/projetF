'use client'

import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const handleLogin = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email',
        redirectTo: window.location.origin
      }
    })

    if (error) {
      console.error('Login error:', error)
      alert('Erreur de connexion: ' + error.message)
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="px-8 py-4 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase tracking-widest hover:bg-white transition-all active:scale-95"
    >
      Connect with Discord
    </button>
  )
}