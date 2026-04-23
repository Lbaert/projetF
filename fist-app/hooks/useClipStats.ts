'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClipStats {
  totalClips: number
  progress: number
}

export function useClipStats() {
  const [stats, setStats] = useState<ClipStats>({ totalClips: 0, progress: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('posts')
        .select('score')
        .eq('type', 'clip')

      if (error) {
        console.error('Error fetching stats:', error)
        setLoading(false)
        return
      }

      const clipsWithHighScore = data?.filter(post => post.score > 50) || []
      const totalClips = clipsWithHighScore.length
      const progress = Math.min((totalClips / 100) * 100, 100)

      setStats({ totalClips, progress })
      setLoading(false)
    }

    fetchStats()
  }, [])

  return { stats, loading }
}
