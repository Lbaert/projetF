'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useClipStats } from '@/hooks/useClipStats'

export default function HomePage() {
  const { stats, loading } = useClipStats()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        window.location.href = '/feed'
      }
    }
    checkUser()
  }, [])

  const handleDiscordAuth = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
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
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] text-[#3cd7ff] overflow-hidden">
      {/* HUD Grid Background */}
      <div className="fixed inset-0 hud-grid pointer-events-none" />

      {/* Radar Rings */}
      <div className="radar-ring w-[300px] h-[300px]" />
      <div className="radar-ring w-[600px] h-[600px]" />
      <div className="radar-ring w-[900px] h-[900px] opacity-40" />
      <div className="radar-ring w-[1200px] h-[1200px] opacity-20" />

      {/* Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[2px] h-32 bg-cyan-500/30 absolute" />
        <div className="h-[2px] w-32 bg-cyan-500/30 absolute" />
        <div className="w-[400px] h-[250px] border-x border-cyan-500/20 relative">
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-cyan-500" />
          <div className="absolute top-0 right-0 w-8 h-[1px] bg-cyan-500" />
          <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-cyan-500" />
          <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-cyan-500" />
        </div>
      </div>

      {/* Top Left Info */}
<div className="absolute top-8 left-8 text-[10px] tracking-[0.3em] font-bold flex flex-col gap-2 opacity-70">
        <span>PROJET_FIST // HIGHLIGHT_YOUTUBE</span>
        <span>POUR PRIMATE ET LYCANTHROPE</span>
        <div className="w-32 h-[1px] bg-cyan-500/30"></div>
        <span className="text-orange-500">SOYEZ ACTEUR</span>
      </div>

      {/* Top Right Info */}
      <div className="absolute top-8 right-8 text-right text-[10px] tracking-[0.3em] font-bold flex flex-col gap-2 opacity-70">
        <span>CHARGE ESTIMÉE: 100CLIPS, 40BRUITAGES/SOUNDBOARD(80), 1MUSIQUE, ∞REF</span>
        <span>5MIN // 80%HIGHLIGHT // 20%TEXTE</span>
        <div className="flex flex-col items-end gap-1">
            <span className="text-orange-500">{stats.totalClips}/100 CLIPS &gt;50%</span>
            <div className="w-32 h-2 bg-neutral-800 border border-cyan-500/30 relative overflow-hidden">
              <div
                className="h-full bg-[#C2FE0C] transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-[8px] text-neutral-500">{Math.round(stats.progress)}% COMPLET</span>
          </div>
      </div>

      {/* Bottom Left */}
      <div className="absolute bottom-8 left-8 flex gap-4 items-end opacity-40">
        <div className="flex flex-col gap-1">
          <div className="h-1 w-8 bg-cyan-500" />
          <div className="h-1 w-12 bg-cyan-500" />
          <div className="h-1 w-6 bg-cyan-500" />
        </div>
        <span className="text-[8px] tracking-[0.5em] uppercase">C&apos;EST PAS FINI ?//!</span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-12 relative group cursor-default">
          <img
            src="/logo.webp"
            alt="Logo"
            className="object-contain w-32 h-32 logo-text"
          />
          <div className="absolute -inset-4 border border-cyan-500/10 rounded-full" />
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/60 mb-2 font-bold">
            VOTE POUR OU CONTRE
          </div>

          <button
            onClick={handleDiscordAuth}
            className="comm-link-btn px-10 py-5 flex items-center gap-4 group"
            style={{ borderColor: '#C2FE0C' }}
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="#C2FE0C">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="font-bold tracking-[0.2em] uppercase text-sm text-[#C2FE0C] group-hover:text-black transition-colors">CO TOI CHACAL</span>
            <span className="w-2 h-2 bg-[#C2FE0C] rounded-full animate-pulse shadow-[0_0_8px_#C2FE0C]" />
          </button>

          <div className="mt-12 flex flex-col items-center">
            <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Protocol 7-G</div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-cyan-500/20" />
              <div className="w-1 h-1 bg-cyan-500/20" />
              <div className="w-1 h-1 bg-cyan-500/20" />
              <div className="w-1 h-1 bg-orange-500/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500/20 m-4 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-cyan-500/20 m-4 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-cyan-500/20 m-4 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-500/20 m-4 pointer-events-none" />
    </div>
  )
}
