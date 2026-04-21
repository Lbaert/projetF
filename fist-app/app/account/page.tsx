'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth()
  const [myPosts, setMyPosts] = useState<(Post & { user: any })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchMyPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, user:users(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMyPosts(data || [])
      setLoading(false)
    }

    fetchMyPosts()
  }, [user])

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setMyPosts(myPosts.filter((p) => p.id !== postId))
  }

  if (authLoading || loading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user) {
    return <div className="p-8 text-center">Non connecté</div>
  }

  const totalScore = myPosts.reduce((acc, post) => acc + post.score, 0)

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">Mon Compte</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Posts</p>
          <p className="text-3xl font-bold text-[#C9A227]">{myPosts.length}</p>
        </div>
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Score total</p>
          <p className="text-3xl font-bold text-[#C9A227]">{totalScore}</p>
        </div>
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Rôle</p>
          <p className="text-xl font-bold text-[#8B0000]">{user.role}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Mes Posts</h2>
      {myPosts.length === 0 ? (
        <p className="text-[#71717A]">Aucun post pour le moment</p>
      ) : (
        <div className="grid gap-4">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4 flex justify-between items-center">
              <div>
                <span className="text-[#71717A] text-sm">[{post.type}]</span>
                <p className="mt-1">{post.content}</p>
                <p className="text-sm text-[#71717A]">Score: {post.score}</p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-red-500 hover:text-red-400"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}