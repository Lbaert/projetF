'use client'

import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/feed')}
            className="px-4 py-2 bg-[#C2FE0C] text-black font-display text-xs font-bold uppercase hover:bg-white transition-colors"
          >
            Back
          </button>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tighter">
            PROTOCOL_7-G
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Mission */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Mission
          </h2>
          <p className="text-zinc-300 font-['Space_Grotesk'] text-sm leading-relaxed">
            FIST est une plateforme de curation collaborative pour la communauté Primate & Lycanthrope.
            Chaque membre peut soumettre des clips, références et contenus musicaux pour être votés par la communauté.
            Les contenus les plus appréciés sont mis en avant.
          </p>
        </section>

        {/* Roles */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Hiérarchie
          </h2>
          <div className="space-y-3">
            {[
              { role: 'ADMIN', desc: 'Accès complet, modération, suppression de tout contenu', color: '#ef4444' },
              { role: 'LYCANTHROPE', desc: 'Accès upload complet, voting, voir toutes les stats', color: '#C2FE0C' },
              { role: 'PRIMATE', desc: 'Upload limité (5 posts/jour), voting actif', color: '#22c55e' },
              { role: 'SINGE', desc: 'Upload très limité (2 posts/jour), voting limité', color: '#f59e0b' },
              { role: 'VISITOR', desc: 'Lecture seule, pas de voting', color: '#6b7280' },
            ].map(({ role, desc, color }) => (
              <div key={role} className="flex items-start gap-4">
                <span className="font-display text-xs font-bold uppercase shrink-0" style={{ color }}>
                  {role}
                </span>
                <span className="text-zinc-400 font-['Space_Grotesk'] text-sm">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Content Types */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Types de Contenu
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'CLIP', icon: '/video.webp', desc: 'Vidéos YouTube/Twitch' },
              { name: 'MUSIC', icon: '/audio.webp', desc: 'Pistes audio' },
              { name: 'REFERENCE', icon: '/texte.webp', desc: 'Textes, citations' },
            ].map(({ name, icon, desc }) => (
              <div key={name} className="bg-zinc-900 p-4 text-center">
                <img src={icon} alt={name} className="w-12 h-12 object-contain mx-auto mb-2" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
                <span className="text-xs font-display font-bold text-[#C2FE0C] uppercase block mb-1">{name}</span>
                <span className="text-[10px] text-zinc-500 font-['Space_Grotesk']">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Règles
          </h2>
          <ol className="space-y-2 text-zinc-300 font-['Space_Grotesk'] text-sm list-decimal list-inside">
            <li>Respectez les autres membres de la communauté</li>
            <li>Pas de contenu NSFW ou offensant</li>
            <li>Pas de spam ou double-post</li>
            <li>Les votes doivent être honnêtes et éclairés</li>
            <li>Le non-respect des règles entraîne une rétrogradation de rôle</li>
          </ol>
        </section>

        {/* Technical */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Technique
          </h2>
          <div className="space-y-2 text-zinc-400 font-['Space_Grotesk'] text-xs">
            <p>
              <span className="text-zinc-500">Développement:</span> Next.js 15 + Supabase
            </p>
            <p>
              <span className="text-zinc-500">Authentification:</span> Discord OAuth
            </p>
            <p>
              <span className="text-zinc-500">Rôles Discord:</span> Synchronisés automatiquement
            </p>
            <p>
              <span className="text-zinc-500">Version:</span> Protocole 7-G
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-black border border-zinc-800 p-6 text-center">
          <p className="text-zinc-500 font-['Space_Grotesk'] text-xs">
            Pour toute question, contactez un administrateur sur Discord.
          </p>
        </section>
      </div>
    </div>
  )
}