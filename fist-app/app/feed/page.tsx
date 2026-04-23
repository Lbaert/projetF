'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { PostCard } from '@/components/PostCard'
import { AuthButton } from '@/components/AuthButton'
import { createClient } from '@/lib/supabase/client'
import type { ContentType } from '@/lib/types'

export default function FeedPage() {
  const { user, loading: authLoading, error: authError, canUpload, isAdmin } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const { posts, loading: postsLoading, refetch } = usePosts(filter)

  const [type, setType] = useState<ContentType>('clip')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user && !authError) {
      router.push('/')
    }
  }, [authLoading, user, authError, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpload) return
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', authUser?.id)
        .single()

      const { error } = await supabase.from('posts').insert({
        user_id: dbUser?.id,
        type,
        content,
      })

      if (error) throw error

      setContent('')
      setType('clip')
      refetch()
    } catch (error) {
      console.error('Upload error:', error)
      alert("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    refetch()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-[#3cd7ff] font-display text-xs uppercase tracking-widest animate-pulse">
          Loading Identity...
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-red-500 font-display text-xs uppercase">Error: {authError}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <h1 className="text-5xl font-black text-[#3cd7ff] tracking-tighter font-display mb-4">
            VOTE_TERMINAL
          </h1>
          <p className="mb-8 text-neutral-500 font-display text-xs uppercase tracking-widest">
            Authentification Requise
          </p>
          <AuthButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar - Vertical */}
      <aside className="w-14 bg-black border-r-2 border-[#C2FE0C]/30 sticky top-0 h-screen shrink-0 flex flex-col items-center gap-4">
        {/* Avatar with logout on hover */}
        <div className="relative group shrink-0 cursor-pointer w-[57px] h-[56px] bg-black flex items-end justify-end pr-1 pb-1">
          {user.avatar && (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-black transition-all group-hover:border-[#C2FE0C]"
            />
          )}
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-[#C2FE0C] text-2xl font-bold">×</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          {(['all', 'clip', 'music', 'reference'] as (ContentType | 'all')[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`w-14 h-14 flex items-center justify-center transition-all ${
                filter === f
                  ? 'bg-[#bbf600]'
                  : 'hover:bg-zinc-800'
              }`}
            >
              {f === 'clip' && <img src="/video.webp" alt="Clip" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
              {f === 'music' && <img src="/audio.webp" alt="Audio" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
              {f === 'reference' && <img src="/texte.webp" alt="Texte" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
              {f === 'all' && <img src="/all.webp" alt="All" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar with Form */}
        <div className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
          {canUpload && (
            <form onSubmit={handleSubmit} className="flex items-center max-w-5xl mx-auto">
              <div className="flex items-center flex-1">
                <div className="flex gap-0">
                  {(['clip', 'music', 'reference'] as ContentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`w-14 h-14 shrink-0 flex items-center justify-center transition-all border-2 ${
                        type === t
                          ? 'bg-[#bbf600] text-black border-[#bbf600]'
                          : t === 'music'
                            ? 'border-t-zinc-800 border-b-zinc-800 border-l-zinc-800 border-r-[#0a0a0a] hover:border-t-[#bbf600]/50 hover:border-b-[#bbf600]/50 hover:border-l-[#bbf600]/50 hover:border-r-[#bbf600]/50'
                            : 'border-zinc-800 hover:border-[#bbf600]/50'
                      }`}
                    >
                      {t === 'clip' && (
                        <img
                          src="/video.webp"
                          alt="Clip"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                      {t === 'music' && (
                        <img
                          src="/audio.webp"
                          alt="Audio"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                      {t === 'reference' && (
                        <img
                          src="/texte.webp"
                          alt="Texte"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {(type === 'clip' || type === 'music') && (
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="HTTPS://SOURCE_FEED.01"
                    required
                    className="h-14 flex-1 bg-transparent border-y-2 border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800"
                  />
                )}
                {type === 'reference' && (
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="DESCRIBE THE ASSET..."
                    required
                    className="h-14 flex-1 bg-transparent border-y-2 border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800"
                  />
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="h-14 px-6 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase tracking-wider hover:bg-[#a4d700] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span>INITIATE</span>
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Posts Grid */}
        <div className="p-6 flex-1">
          {postsLoading ? (
            <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
              Chargement...
            </p>
          ) : posts.length === 0 ? (
            <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
              Aucun contenu pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canVote={canUpload}
                  canDelete={isAdmin || post.user?.discord_id === user.discord_id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}