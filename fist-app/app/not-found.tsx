'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/')
    }, 5000)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 hud-grid opacity-20" />

      {/* Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] border border-[#C2FE0C]/10 rounded-full animate-ping" />
        <div className="absolute w-[500px] h-[500px] border border-[#C2FE0C]/5 rounded-full" />
        <div className="absolute w-[700px] h-[700px] border border-[#C2FE0C]/5 rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <h1 className="text-[120px] font-black font-display text-[#C2FE0C] leading-none select-none">
            404
          </h1>
          <div className="w-32 h-1 bg-[#C2FE0C] mx-auto mb-6" />
        </div>

        <h2 className="text-2xl font-bold font-display text-white uppercase tracking-wider mb-4">
          Signal Lost
        </h2>

        <p className="text-zinc-500 font-['Space_Grotesk'] text-sm mb-8 max-w-md mx-auto">
          La page que vous cherchez n'existe pas ou a été déplacée.
          <br />
          Redirection automatique vers l'accueil...
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-[#C2FE0C] text-black font-display font-black text-xs uppercase tracking-wider hover:bg-white transition-colors"
          >
            Retour à l'accueil
          </button>

          <div className="flex items-center gap-2 text-zinc-600 text-xs font-['Space_Grotesk']">
            <span className="w-2 h-2 bg-[#C2FE0C] rounded-full animate-pulse" />
            <span>Connexion sécurisée • Protocole 7-G</span>
          </div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#C2FE0C]/20 m-4 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-[#C2FE0C]/20 m-4 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-[#C2FE0C]/20 m-4 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#C2FE0C]/20 m-4 pointer-events-none" />

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}