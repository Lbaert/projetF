'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { PostCard } from '@/components/PostCard'
import { PostForm } from '@/components/PostForm'
import { FilterBar } from '@/components/FilterBar'
import { AuthButton } from '@/components/AuthButton'
import type { ContentType } from '@/lib/types'

export default function FeedPage() {
  const { user, loading: authLoading, error: authError, canUpload, isAdmin } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const { posts, loading: postsLoading, refetch } = usePosts(filter)

  useEffect(() => {
    if (!authLoading && !user && !authError) {
      router.push('/')
    }
  }, [authLoading, user, authError, router])

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black text-[#C2FE0C] border-b-2 border-[#C2FE0C]/30 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-6xl mx-auto">
          <div className="text-2xl font-black text-[#C2FE0C] tracking-tighter italic font-display uppercase">
            VOTE_TERMINAL
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col">
              <span className="font-display text-xs font-bold text-[#C2FE0C]">{user.username?.toUpperCase()}</span>
              <span className="font-display text-[10px] text-neutral-500 uppercase tracking-widest">{user.role}</span>
            </div>
            <button
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="px-3 py-1.5 text-xs font-display font-bold uppercase bg-[#C2FE0C] text-black hover:bg-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-wrap items-end justify-between mb-8 gap-6 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="font-display text-4xl font-bold text-white uppercase mb-2">LIVE_FEED</h1>
            <div className="flex gap-4">
              <span className="text-[10px] font-display font-bold text-[#C2FE0C] bg-[#C2FE0C]/10 px-2 py-0.5 border border-[#C2FE0C]/20">
                SYSTEM: ACTIVE
              </span>
              <span className="text-[10px] font-display font-bold text-neutral-500 bg-neutral-900 px-2 py-0.5 border border-neutral-800">
                NODES: {posts.length}
              </span>
            </div>
          </div>
          <FilterBar selected={filter} onChange={setFilter} />
        </div>

        {canUpload && <PostForm onSuccess={refetch} />}

        {postsLoading ? (
          <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
            Chargement...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
            Aucun contenu pour le moment
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </div>
  )
}
