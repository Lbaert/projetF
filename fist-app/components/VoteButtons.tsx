'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VoteButtonsProps {
  postId: string
  initialScore: number
  userVote: 1 | -1 | null
  canVote: boolean
}

export function VoteButtons({ postId, initialScore, userVote, canVote }: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore)
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
        setCurrentVote(null)
      } else if (currentVote === null) {
        await supabase.from('votes').insert({ post_id: postId, value })
        setScore(score + value)
        setCurrentVote(value)
      } else {
        await supabase.from('votes').update({ value }).match({ post_id: postId })
        setScore(score + (value * 2))
        setCurrentVote(value)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={!canVote || loading}
        className={`px-3 py-1 rounded font-bold transition-colors ${
          currentVote === 1
            ? 'bg-green-600 text-white'
            : 'bg-[#4A4A4A] hover:bg-green-700'
        } disabled:opacity-50`}
      >
        👍 {score > 0 ? `+${score}` : score}
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={!canVote || loading}
        className={`px-3 py-1 rounded font-bold transition-colors ${
          currentVote === -1
            ? 'bg-red-700 text-white'
            : 'bg-[#4A4A4A] hover:bg-red-700'
        } disabled:opacity-50`}
      >
        👎
      </button>
    </div>
  )
}