'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { PostCard } from '@/components/PostCard'
import { PostForm } from '@/components/PostForm'
import { FilterBar } from '@/components/FilterBar'
import { AuthButton } from '@/components/AuthButton'
import type { ContentType } from '@/lib/types'

export default function FeedPage() {
  const { user, loading: authLoading, canUpload, isAdmin } = useAuth()
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const { posts, loading: postsLoading, refetch } = usePosts(filter)

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    refetch()
  }

  if (authLoading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#C9A227] mb-4">FIST</h1>
          <p className="mb-6 text-[#71717A]">Connecte-toi pour participer</p>
          <AuthButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">FIST - Feed</h1>
        <div className="flex items-center gap-4">
          <img src={user.avatar || ''} alt={user.username} className="w-10 h-10 rounded-full" />
          <span className="font-bold text-[#C9A227]">{user.username}</span>
        </div>
      </header>

      {canUpload && <PostForm onSuccess={refetch} />}

      <FilterBar selected={filter} onChange={setFilter} />

      {postsLoading ? (
        <p className="text-center py-8 text-[#71717A]">Chargement...</p>
      ) : posts.length === 0 ? (
        <p className="text-center py-8 text-[#71717A]">Aucun contenu pour le moment</p>
      ) : (
        <div className="grid gap-4 mt-6">
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
  )
}