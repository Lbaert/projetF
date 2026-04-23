'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[Auth] Session error:', sessionError)
          if (mounted) {
            setError(sessionError.message)
            setLoading(false)
          }
          return
        }

          if (session?.user) {
          const fetchUserWithRetry = async (retries = 3, delay = 500) => {
            for (let i = 0; i < retries; i++) {
              const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()
              if (data) return data
              if (i < retries - 1) await new Promise(r => setTimeout(r, delay))
            }
            return null
          }

          const existingUser = await fetchUserWithRetry()

          if (existingUser) {
            console.log('[Auth] Existing user found:', existingUser)
            if (mounted) {
              setUser(existingUser)
              setLoading(false)
            }
          } else {
            console.error('[Auth] User not found after retries - trigger may have failed')
            if (mounted) {
              setError('User not found. Please contacter le support.')
              setLoading(false)
            }
          }
        } else {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('[Auth] Exception:', err)
        if (mounted) {
          setError(String(err))
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State change:', event)
      if (event === 'SIGNED_IN' && session?.user) {
        const fetchUserWithRetry = async (retries = 3, delay = 500) => {
          for (let i = 0; i < retries; i++) {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (data) return data
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay))
          }
          return null
        }

        fetchUserWithRetry().then(async (data) => {
            if (data) {
              setUser(data)
              // Sync Discord role
              const { data: { session } } = await supabase.auth.getSession()
              await fetch('/api/discord-role', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session?.access_token || ''}`
                }
              })
                .then(res => res.json())
                .then(async (roleData) => {
                  if (roleData.role && roleData.role !== data.role) {
                    setUser({ ...data, role: roleData.role })
                  }
                })
            } else {
              console.error('[Auth] User not found in database - trigger may have failed')
            }
            setLoading(false)
          })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const canUpload = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const canVote = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return { user, loading, error, canUpload, canVote, isAdmin }
}