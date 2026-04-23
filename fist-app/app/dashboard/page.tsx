'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/StatsCard'
import { Leaderboard } from '@/components/Leaderboard'

export default function DashboardPage() {
  const { user, loading: authLoading, canUpload } = useAuth()
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalParticipants: 0,
    totalVotes: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    byType: { clip: 0, music: 0, reference: 0, soundboard: 0 },
  })
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user || !canUpload) return

    const fetchStats = async () => {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, user:users(*), votes(value)')

      if (posts) {
        const allVotes = posts.flatMap((p: any) => p.votes || [])
        const upvotes = allVotes.filter((v: any) => v.value === 1).length
        const downvotes = allVotes.filter((v: any) => v.value === -1).length

        setStats({
          totalPosts: posts.length,
          totalParticipants: new Set(posts.map((p: any) => p.user_id)).size,
          totalVotes: allVotes.length,
          totalUpvotes: upvotes,
          totalDownvotes: downvotes,
          byType: {
            clip: posts.filter((p: any) => p.type === 'clip').length,
            music: posts.filter((p: any) => p.type === 'music').length,
            reference: posts.filter((p: any) => p.type === 'reference').length,
            soundboard: posts.filter((p: any) => p.type === 'soundboard').length,
          },
        })

        const userMap = new Map<string, any>()
        posts.forEach((post: any) => {
          if (!userMap.has(post.user_id)) {
            userMap.set(post.user_id, {
              username: post.user?.username,
              avatar: post.user?.avatar,
              postCount: 0,
              totalScore: 0,
            })
          }
          const u = userMap.get(post.user_id)
          u.postCount++
          u.totalScore += post.score
        })

        setParticipants(
          Array.from(userMap.values()).sort((a, b) => b.totalScore - a.totalScore)
        )
      }

      setLoading(false)
    }

    fetchStats()
  }, [user, canUpload])

  if (authLoading || loading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user || !canUpload) {
    return <div className="p-8 text-center">Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Posts" value={stats.totalPosts} icon="📝" />
        <StatsCard title="Participants" value={stats.totalParticipants} icon="👥" />
        <StatsCard title="Total Votes" value={stats.totalVotes} icon="🗳️" />
        <StatsCard title="Ratio 👍/👎" value={stats.totalDownvotes ? `${(stats.totalUpvotes / stats.totalDownvotes).toFixed(1)}:1` : `${stats.totalUpvotes}:0`} icon="📈" />
        <StatsCard
          title="Score Moyen"
          value={stats.totalPosts ? Math.round(stats.totalVotes / stats.totalPosts * 10) / 10 : 0}
          icon="📊"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard title="👍 Upvotes" value={stats.totalUpvotes} icon="👍" />
        <StatsCard title="👎 Downvotes" value={stats.totalDownvotes} icon="👎" />
        <StatsCard title="Ratio Up/Down" value={`${Math.round(stats.totalUpvotes / (stats.totalUpvotes + stats.totalDownvotes || 1) * 100)}%`} icon="📊" />
      </div>

      <h2 className="text-xl font-bold mb-4">Répartition par Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard title="🎬 Clips" value={stats.byType.clip} />
        <StatsCard title="🎵 Musiques" value={stats.byType.music} />
        <StatsCard title="💬 Références" value={stats.byType.reference} />
        <StatsCard title="🔊 Soundboard" value={stats.byType.soundboard} />
      </div>

      <Leaderboard participants={participants} />
    </div>
  )
}