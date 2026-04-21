'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', authUser.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', session.user.id)
          .single()
        setUser(data)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const canUpload = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const canVote = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return { user, loading, canUpload, canVote, isAdmin }
}