'use client'

import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email',
        redirectTo: window.location.origin + '/feed'
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
      className="px-4 py-2 bg-[#4B5320] text-white font-bold rounded hover:bg-[#3a3f18] transition-colors"
    >
      Se connecter avec Discord
    </button>
  )
}