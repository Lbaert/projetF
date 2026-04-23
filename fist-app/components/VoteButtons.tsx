'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VoteButtonsProps {
  postId: string
  initialScore: number
  upvotes: number
  downvotes: number
  userVote: 1 | -1 | null
  canVote: boolean
}

export function VoteButtons({ postId, initialScore, upvotes, downvotes, userVote, canVote }: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore)
  const [up, setUp] = useState(upvotes)
  const [down, setDown] = useState(downvotes)
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleVote = async (value: 1 | -1) => {
    if (!canVote || loading) return
    setLoading(true)

    try {
      if (currentVote === value) {
        await supabase.from('votes').delete().match({ post_id: postId })
        setScore(score - value)
        if (value === 1) setUp(up - 1)
        else setDown(down - 1)
        setCurrentVote(null)
      } else if (currentVote === null) {
        await supabase.from('votes').insert({ post_id: postId, value })
        setScore(score + value)
        if (value === 1) setUp(up + 1)
        else setDown(down + 1)
        setCurrentVote(value)
      } else {
        await supabase.from('votes').update({ value }).match({ post_id: postId })
        setScore(score + (value * 2))
        if (value === 1) {
          setUp(up + 1)
          setDown(down - 1)
        } else {
          setUp(up - 1)
          setDown(down + 1)
        }
        setCurrentVote(value)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setLoading(false)
    }
  }

  const likePercent = up + down > 0 ? Math.round((up / (up + down)) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={!canVote || loading}
        className={`px-3 py-1.5 font-['Space_Grotesk'] text-xs font-bold transition-all flex items-center gap-1 ${
          currentVote === 1
            ? 'bg-[#bbf600] text-black'
            : 'bg-zinc-800 text-zinc-400 hover:bg-[#bbf600] hover:text-black'
        } disabled:opacity-50`}
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
        <span>{up}</span>
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={!canVote || loading}
        className={`px-3 py-1.5 font-['Space_Grotesk'] text-xs font-bold transition-all flex items-center gap-1 ${
          currentVote === -1
            ? 'bg-red-600 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white'
        } disabled:opacity-50`}
      >
        <span className="material-symbols-outlined text-sm">thumb_down</span>
        <span>{down}</span>
      </button>
      <span className="font-['Space_Grotesk'] text-xs font-bold text-[#bbf600]">{likePercent}%</span>
    </div>
  )
}