'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Post, ContentType } from '@/lib/types'

export function usePosts(type: ContentType | 'all' = 'all') {
  const [posts, setPosts] = useState<(Post & { user: any; user_vote?: 1 | -1 })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          votes(value, user_id)
        `)
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) throw error

      const { data: { user: authUser } } = await supabase.auth.getUser()
      let userVoteId = null
      if (authUser) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('discord_id', authUser.id)
          .single()
        userVoteId = dbUser?.id
      }

      const postsWithVotes = (data || []).map((post: any) => {
        const votes = post.votes || []
        const upvotes = votes.filter((v: any) => v.value === 1).length
        const downvotes = votes.filter((v: any) => v.value === -1).length
        const likePercent = upvotes + downvotes > 0 ? (upvotes * 100) / (upvotes + downvotes) : 0
        return {
          ...post,
          user_vote: votes.find((v: any) => v.user_id === userVoteId)?.value || null,
          like_percent: likePercent,
          upvotes,
          downvotes,
        }
      })

      postsWithVotes.sort((a, b) => b.like_percent - a.like_percent)

      setPosts(postsWithVotes)
    } catch (error) {
      console.error('Fetch posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [type])

  return { posts, loading, refetch: fetchPosts }
}