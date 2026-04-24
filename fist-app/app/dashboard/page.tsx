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

interface Stats {
  totalPosts: number
  totalVotes: number
  totalUpvotes: number
  totalDownvotes: number
  postsByType: Record<ContentType, number>
  votesByType: Record<ContentType, number>
  topUsers: { username: string; postCount: number; voteCount: number }[]
  recentPosts: Post[]
  topPosts: { content: string; type: ContentType; score: number; voteCount: number }[]
  roleDistribution: Record<string, number>
  avgVotesPerPost: number
  completionPercent: number
}

export default function DashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])

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

      const { data: allUsers } = await supabase.from('users').select('*')

      if (!allPosts || !allUsers) return

      setPosts(allPosts)

      const totalPosts = allPosts.length
      const totalVotes = allPosts.reduce((sum, p) => sum + (p.votes?.length || 0), 0)
      const totalUpvotes = allPosts.reduce((sum, p) => sum + (p.votes?.filter(v => v.value === 1).length || 0), 0)
      const totalDownvotes = allPosts.reduce((sum, p) => sum + (p.votes?.filter(v => v.value === -1).length || 0), 0)

      const postsByType: Record<ContentType, number> = { clip: 0, music: 0, reference: 0 }
      const votesByType: Record<ContentType, number> = { clip: 0, music: 0, reference: 0 }

      allPosts.forEach(p => {
        postsByType[p.type] = (postsByType[p.type] || 0) + 1
        votesByType[p.type] = (votesByType[p.type] || 0) + (p.votes?.length || 0)
      })

      const userStats: Record<string, { postCount: number; voteCount: number; username: string }> = {}
      allPosts.forEach(p => {
        if (!userStats[p.user_id]) {
          userStats[p.user_id] = { postCount: 0, voteCount: 0, username: p.user?.username || 'Unknown' }
        }
        userStats[p.user_id].postCount++
        userStats[p.user_id].voteCount += p.votes?.length || 0
      })

      const topUsers = Object.values(userStats)
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 10)

      const recentPosts = allPosts.slice(0, 5)

      const topPosts = allPosts.map(p => {
        const upvotes = p.votes?.filter(v => v.value === 1).length || 0
        const downvotes = p.votes?.filter(v => v.value === -1).length || 0
        return {
          content: p.content,
          type: p.type,
          score: upvotes - downvotes,
          voteCount: p.votes?.length || 0,
        }
      }).sort((a, b) => b.score - a.score).slice(0, 5)

      const roleDistribution: Record<string, number> = {}
      allUsers.forEach(u => {
        roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1
      })

      const avgVotesPerPost = totalPosts > 0 ? Math.round((totalVotes / totalPosts) * 10) / 10 : 0
      const completionPercent = Math.min(100, Math.round((totalPosts / 100) * 100))

      setStats({
        totalPosts,
        totalVotes,
        totalUpvotes,
        totalDownvotes,
        postsByType,
        votesByType,
        topUsers,
        recentPosts,
        topPosts,
        roleDistribution,
        avgVotesPerPost,
        completionPercent,
      })
      setLoading(false)
    }

    fetchData()
  }, [user])

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[#C2FE0C] font-display text-xs uppercase tracking-widest animate-pulse">
          Loading Metrics...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-red-500 font-display text-xs uppercase">
          Access Denied - Admin Only
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tighter">
            METRICS_DASHBOARD
          </h1>
          <button
            onClick={() => router.push('/feed')}
            className="px-4 py-2 bg-[#C2FE0C] text-black font-display text-xs font-bold uppercase hover:bg-white transition-colors"
          >
            Back to Feed
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <StatCard label="TOTAL_POSTS" value={stats.totalPosts} color="#C2FE0C" />
          <StatCard label="TOTAL_VOTES" value={stats.totalVotes} color="#C2FE0C" />
          <StatCard label="UPVOTES" value={stats.totalUpvotes} color="#22c55e" />
          <StatCard label="DOWNVOTES" value={stats.totalDownvotes} color="#ef4444" />
          <StatCard label="AVG_VOTES/POST" value={stats.avgVotesPerPost} color="#C2FE0C" />
          <StatCard label="COMPLETION" value={`${stats.completionPercent}%`} color="#C2FE0C" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Posts by Type */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">Posts by Type</h2>
            <div className="space-y-3">
              {(['clip', 'music', 'reference'] as ContentType[]).map(type => (
                <div key={type}>
                  <div className="flex justify-between text-xs font-['Space_Grotesk'] text-zinc-400 mb-1">
                    <span className="uppercase">{type}</span>
                    <span>{stats.postsByType[type]} ({Math.round((stats.postsByType[type] / stats.totalPosts) * 100) || 0}%)</span>
                  </div>
                  <div className="h-2 bg-zinc-800">
                    <div
                      className="h-full bg-[#C2FE0C] transition-all"
                      style={{ width: `${(stats.postsByType[type] / stats.totalPosts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Votes by Type */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">Votes by Type</h2>
            <div className="space-y-3">
              {(['clip', 'music', 'reference'] as ContentType[]).map(type => (
                <div key={type}>
                  <div className="flex justify-between text-xs font-['Space_Grotesk'] text-zinc-400 mb-1">
                    <span className="uppercase">{type}</span>
                    <span>{stats.votesByType[type]}</span>
                  </div>
                  <div className="h-2 bg-zinc-800">
                    <div
                      className="h-full bg-[#C2FE0C] transition-all"
                      style={{ width: `${stats.totalVotes > 0 ? (stats.votesByType[type] / stats.totalVotes) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">User Roles</h2>
            <div className="space-y-3">
              {Object.entries(stats.roleDistribution).map(([role, count]) => (
                <div key={role}>
                  <div className="flex justify-between text-xs font-['Space_Grotesk'] text-zinc-400 mb-1">
                    <span className="uppercase">{role}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 bg-zinc-800">
                    <div
                      className="h-full bg-[#C2FE0C] transition-all"
                      style={{ width: `${(count / Object.values(stats.roleDistribution).reduce((a, b) => a + b, 0)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Users */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">Top Contributors</h2>
            <table className="w-full text-xs font-['Space_Grotesk']">
              <thead>
                <tr className="text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2">User</th>
                  <th className="text-right py-2">Posts</th>
                  <th className="text-right py-2">Votes</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((u, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-300">{u.username}</td>
                    <td className="py-2 text-right text-zinc-400">{u.postCount}</td>
                    <td className="py-2 text-right text-[#C2FE0C]">{u.voteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Posts */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">Top Rated Posts</h2>
            <table className="w-full text-xs font-['Space_Grotesk']">
              <thead>
                <tr className="text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Content</th>
                  <th className="text-right py-2">Score</th>
                  <th className="text-right py-2">Votes</th>
                </tr>
              </thead>
              <tbody>
                {stats.topPosts.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-500 uppercase">{p.type}</td>
                    <td className="py-2 text-zinc-300 truncate max-w-[150px]">{p.content}</td>
                    <td className={`py-2 text-right font-bold ${p.score > 0 ? 'text-green-500' : p.score < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                      {p.score > 0 ? '+' : ''}{p.score}
                    </td>
                    <td className="py-2 text-right text-zinc-400">{p.voteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-black border border-zinc-800 p-6">
          <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">Recent Posts</h2>
          <table className="w-full text-xs font-['Space_Grotesk']">
            <thead>
              <tr className="text-zinc-500 uppercase border-b border-zinc-800">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Content</th>
                <th className="text-right py-2">Up</th>
                <th className="text-right py-2">Down</th>
                <th className="text-right py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 10).map((p) => {
                const upvotes = p.votes?.filter(v => v.value === 1).length || 0
                const downvotes = p.votes?.filter(v => v.value === -1).length || 0
                const score = upvotes - downvotes
                const timeAgo = new Date(p.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <tr key={p.id} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-500">{timeAgo}</td>
                    <td className="py-2 text-zinc-400 uppercase">{p.type}</td>
                    <td className="py-2 text-zinc-300">{p.user?.username}</td>
                    <td className="py-2 text-zinc-300 truncate max-w-[200px]">{p.content}</td>
                    <td className="py-2 text-right text-green-500">{upvotes}</td>
                    <td className="py-2 text-right text-red-500">{downvotes}</td>
                    <td className={`py-2 text-right font-bold ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                      {score > 0 ? '+' : ''}{score}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-black border border-zinc-800 p-4">
      <div className="text-[10px] font-['Space_Grotesk'] text-zinc-500 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold font-['Space_Grotesk']" style={{ color }}>
        {value}
      </div>
    </div>
  )
}