'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { ContentType } from '@/lib/types'

interface Post {
  id: string
  type: ContentType
  content: string
  file_path: string | null
  user_id: string
  created_at: string
  votes: { value: number; user_id: string }[]
  user?: { username: string; discord_id: string }
}

export default function AccountPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      const { data: allPosts } = await supabase
        .from('posts')
        .select('*, user:users(username, discord_id), votes(value, user_id)')
        .order('created_at', { ascending: false })

      if (!allPosts) return

      if (isAdmin) {
        setPosts(allPosts)
      } else {
        setPosts(allPosts.filter(p => p.user?.discord_id === user.discord_id))
      }

      setLoading(false)
    }

    fetchData()
  }, [user, isAdmin])

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(posts.filter(p => p.id !== postId))
  }

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[#C2FE0C] font-display text-xs uppercase tracking-widest animate-pulse">
          Loading Account...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/feed')}
              className="px-4 py-2 bg-[#C2FE0C] text-black font-display text-xs font-bold uppercase hover:bg-white transition-colors"
            >
              Back
            </button>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tighter">
              MY_CONTENT
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-['Space_Grotesk'] text-zinc-500 uppercase">
              Role: <span className="text-[#C2FE0C]">{user.role}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 font-display text-sm uppercase tracking-widest">
              Aucun contenu publié
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const upvotes = post.votes?.filter(v => v.value === 1).length || 0
              const downvotes = post.votes?.filter(v => v.value === -1).length || 0
              const score = upvotes - downvotes
              const canDelete = isAdmin || post.user?.discord_id === user.discord_id

              return (
                <div key={post.id} className="bg-black border border-zinc-800 p-4 flex items-center gap-4">
                  {/* Type Icon */}
                  <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center shrink-0">
                    {post.type === 'clip' && <img src="/video.webp" alt="Clip" className="w-8 h-8 object-contain" />}
                    {post.type === 'music' && <img src="/audio.webp" alt="Audio" className="w-8 h-8 object-contain" />}
                    {post.type === 'reference' && <img src="/texte.webp" alt="Texte" className="w-8 h-8 object-contain" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-['Space_Grotesk'] text-sm truncate">{post.content}</p>
                    <p className="text-zinc-500 font-['Space_Grotesk'] text-xs mt-1">
                      {new Date(post.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  {/* Votes */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-green-500 font-['Space_Grotesk'] text-sm font-bold">+{upvotes}</span>
                    <span className="text-red-500 font-['Space_Grotesk'] text-sm font-bold">-{downvotes}</span>
                    <span className={`font-['Space_Grotesk'] text-sm font-bold ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {score > 0 ? '+' : ''}{score}
                    </span>
                  </div>

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-4 py-2 bg-red-600 text-white font-['Space_Grotesk'] text-xs font-bold uppercase hover:bg-red-700 transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}