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
            Les contenus les plus appreciés sont mis en avant.
          </p>
        </section>

        {/* Guide: Feed & Voting */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Feed & Voting
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <p>Le <strong className="text-white">feed</strong> est la page principale ou tous les contenus sont affiches. Les posts sont tries par score de votes (les plus apprecies en haut).</p>
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Comment voter</p>
              <ol className="space-y-1 list-decimal list-inside text-zinc-400">
                <li>Identifie un post dans le feed</li>
                <li>Clique sur la bare de vote (haut ou bas selon ton choix)</li>
                <li>La barre affiche le pourcentage d&apos;aprobation en temps reel</li>
                <li>Tu peux changer ton vote en cliquant sur l&apos;autre option</li>
              </ol>
            </div>
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Filtres</p>
              <p className="text-zinc-400">Utilise les boutons en haut du feed pour filtrer par type:</p>
              <ul className="list-disc list-inside text-zinc-400">
                <li><span className="text-white">ALL</span> — tous les contenus</li>
                <li><span className="text-white">CLIP</span> — videos</li>
                <li><span className="text-white">MUSIC</span> — pistes audio</li>
                <li><span className="text-white">REFERENCE</span> — textes et citations</li>
                <li><span className="text-white">HIGHLIGHT</span> — montages assembles</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guide: Soumettre du contenu */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Soumettre du Contenu
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <p>Pour proposer du contenu, utilise la barre de submission en haut du feed.</p>

            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Methode 1: URL (Clip ou Musique)</p>
              <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                <li>Selectionne le type: <span className="text-white">CLIP</span> ou <span className="text-white">MUSIC</span></li>
                <li>Colle l&apos;URL de la video (YouTube, Twitch, etc.)</li>
                <li>Clique sur <span className="text-[#C2FE0C] font-bold">INITIATE</span></li>
              </ol>
            </div>

            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Methode 2: Upload de fichier (max 20MB)</p>
              <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                <li>Selectionne le type desire</li>
                <li>Clique sur le bouton <span className="text-white">+</span> pour choisir un fichier</li>
                <li>Le fichier doit faire moins de 20MB</li>
                <li>Clique sur <span className="text-[#C2FE0C] font-bold">INITIATE</span></li>
              </ol>
            </div>

            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Methode 3: Reference (Texte)</p>
              <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                <li>Selectionne le type: <span className="text-white">REFERENCE</span></li>
                <li>Ecris ou colle ton texte directement</li>
                <li>Clique sur <span className="text-[#C2FE0C] font-bold">INITIATE</span></li>
              </ol>
            </div>

            <p className="text-zinc-500 text-xs">Note: Les limits d&apos;upload dependent de ton role (Lycanthrope = illimite, Singe = 2/jour, etc.)</p>
          </div>
        </section>

        {/* Guide: Automation Montage */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Automation de Montage
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <p>Le systeme de montage automatique permet de creer des <strong className="text-white">Highlights</strong> a partir de plusieurs videos.</p>

            <div className="space-y-3">
              <div className="bg-zinc-900 p-4 space-y-2">
                <p className="text-[#C2FE0C] font-bold uppercase text-xs">Etape 1: Selectionner les videos</p>
                <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                  <li>Clique sur le bouton <span className="text-white">SELECT</span> dans le header du feed</li>
                  <li>Coche les cases des videos que tu veux utiliser</li>
                  <li>Clique sur <span className="text-[#C2FE0C] font-bold">Lancer le montage</span></li>
                </ol>
              </div>

              <div className="bg-zinc-900 p-4 space-y-2">
                <p className="text-[#C2FE0C] font-bold uppercase text-xs">Etape 2: Traitement automatique</p>
                <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                  <li>FFmpeg analyse l&apos;audio de chaque video</li>
                  <li>Il detecte automatiquement les pics audio (moments forts)</li>
                  <li>Chaque video est decoupee en plusieurs clips autour des pics</li>
                  <li>Tu vois apparaitre les clips generes avec un player video</li>
                </ol>
              </div>

              <div className="bg-zinc-900 p-4 space-y-2">
                <p className="text-[#C2FE0C] font-bold uppercase text-xs">Etape 3: Valider les clips</p>
                <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                  <li>Pour chaque clip, regarde la preview video</li>
                  <li>Clique <span className="text-green-500 font-bold">GARDER</span> si le clip est bon</li>
                  <li>Clique <span className="text-red-500 font-bold">SUPPRIMER</span> si le clip ne convient pas</li>
                  <li>Les clips supprimes sont retires du montage</li>
                </ol>
              </div>

              <div className="bg-zinc-900 p-4 space-y-2">
                <p className="text-[#C2FE0C] font-bold uppercase text-xs">Etape 4: Creer le Highlight</p>
                <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                  <li>Quand tu as valide les clips souhaites, clique sur <span className="text-[#C2FE0C] font-bold">CREER LE HIGHLIGHT</span></li>
                  <li>FFmpeg assemble tous les clips gardes en une seule video</li>
                  <li>Le highlight est automatiquement ajoute au feed</li>
                  <li>Tu peux le retrouver en filtrant par <span className="text-white">HIGHLIGHT</span></li>
                </ol>
              </div>

              <div className="bg-zinc-900 p-4 space-y-2">
                <p className="text-[#C2FE0C] font-bold uppercase text-xs">Parametres audio</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li><span className="text-white">Seuil de Detection (dB):</span> Plus la valeur est haute (-10dB), plus les pics doivent etre forts pour etre detectes. Plus elle est basse (-40dB), plus de clips sont generes.</li>
                  <li><span className="text-white">Pre-buffer / Post-buffer:</span> Duree ajoutee avant et apres chaque pic (en secondes) pour contexte.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Guide: Highlights */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Highlights
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <p>Un <strong className="text-white">Highlight</strong> est un montage video compile a partir de plusieurs clips valides.</p>
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-zinc-400">Les highlights:</p>
              <ul className="list-disc list-inside text-zinc-400 space-y-1">
                <li>Apparaissent dans le feed avec un player video</li>
                <li>Sont标识 par le label <span className="bg-[#bbf600] text-black px-2 py-0.5 text-xs font-bold">HIGHLIGHT</span></li>
                <li>Peuvent etre votes comme les autres posts</li>
                <li>Peuvent etre supprimes par leur auteur ou un admin</li>
              </ul>
            </div>
            <p className="text-zinc-500 text-xs">Si tu supprimes la video originale d&apos;un highlight, le highlight reste. Si tu supprimes un highlight, les videos originales restent.</p>
          </div>
        </section>

        {/* Guide: Roles */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Roles & Discord
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <p>Ton role sur FIST est synchronise automatiquement avec tes roles Discord.</p>
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Comment ca marche</p>
              <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                <li>Un script Discord tourne toutes les heures</li>
                <li>Il recupere la liste des membres du serveur Discord</li>
                <li>Pour chaque membre, il lit ses roles Discord</li>
                <li>Il met a jour ton role dans la base de donnees FIST</li>
              </ol>
            </div>
            <div className="space-y-3">
              {[
                { role: 'ADMIN', desc: 'Acces complet, moderation, suppression de tout contenu', color: '#ef4444' },
                { role: 'LYCANTHROPE', desc: 'Upload illimite, voting actif, acces automation montage', color: '#C2FE0C' },
                { role: 'PRIMATE', desc: 'Upload limite (5 posts/jour), voting actif', color: '#22c55e' },
                { role: 'SINGE', desc: 'Upload tres limite (2 posts/jour), voting limite', color: '#f59e0b' },
                { role: 'VISITOR', desc: 'Lecture seule, pas de voting', color: '#6b7280' },
              ].map(({ role, desc, color }) => (
                <div key={role} className="flex items-start gap-4">
                  <span className="font-display text-xs font-bold uppercase shrink-0" style={{ color }}>{role}</span>
                  <span className="text-zinc-400">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-xs">Si tu changes de role sur Discord, il sera automatiquement reflete sur FIST dans l&apos;heure (lors du prochain sync).</p>
          </div>
        </section>

        {/* Guide: Supprimer */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Guide: Supprimer du Contenu
          </h2>
          <div className="space-y-4 text-zinc-300 font-['Space_Grotesk'] text-sm">
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Qui peut supprimer</p>
              <ul className="list-disc list-inside text-zinc-400 space-y-1">
                <li><span className="text-white">Auteur du post</span> — peut supprimer son propre contenu</li>
                <li><span className="text-white">Admin</span> — peut supprimer n&apos;importe quel post</li>
              </ul>
            </div>
            <div className="bg-zinc-900 p-4 space-y-2">
              <p className="text-[#C2FE0C] font-bold uppercase text-xs">Ce qui se passe</p>
              <ul className="list-disc list-inside text-zinc-400 space-y-1">
                <li>Le fichier video/audio est supprime du storage</li>
                <li>Le post est supprime de la base de donnees</li>
                <li>Les highlights contenant ce contenu restent (ils ont leur propre fichier)</li>
                <li>Les clips gardes restent (ils deviennent independants du post source)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Content Types */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Types de Contenu
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'CLIP', icon: '/video.webp', desc: 'Videos URL ou fichier' },
              { name: 'MUSIC', icon: '/audio.webp', desc: 'Pistes audio' },
              { name: 'REFERENCE', icon: '/texte.webp', desc: 'Textes, citations' },
              { name: 'HIGHLIGHT', icon: '/video.webp', desc: 'Montages assembles' },
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
            Regles
          </h2>
          <ol className="space-y-2 text-zinc-300 font-['Space_Grotesk'] text-sm list-decimal list-inside">
            <li>Respectez les autres membres de la communaute</li>
            <li>Pas de contenu NSFW ou offensant</li>
            <li>Pas de spam ou double-post</li>
            <li>Les votes doivent etre honnetes et eclaires</li>
            <li>Le non-respect des regles entraine une retrogradation de role</li>
          </ol>
        </section>

        {/* Technical */}
        <section className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-xl font-bold text-[#C2FE0C] uppercase mb-4">
            Technique
          </h2>
          <div className="space-y-2 text-zinc-400 font-['Space_Grotesk'] text-xs">
            <p><span className="text-zinc-500">Developpement:</span> Next.js 15 + Supabase</p>
            <p><span className="text-zinc-500">Authentification:</span> Discord OAuth</p>
            <p><span className="text-zinc-500">Rôles Discord:</span> Synchronises automatiquement (chaque heure)</p>
            <p><span className="text-zinc-500">Montage video:</span> FFmpeg.wasm (cote client)</p>
            <p><span className="text-zinc-500">Version:</span> Protocole 7-G</p>
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
