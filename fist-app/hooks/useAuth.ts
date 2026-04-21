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
          // First try to fetch existing user
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', session.user.id)
            .single()

          if (existingUser) {
            console.log('[Auth] Existing user found:', existingUser)
            if (mounted) {
              setUser(existingUser)
              setLoading(false)
            }
          } else {
            // User doesn't exist, try to insert
            console.log('[Auth] Creating new user...')
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                discord_id: session.user.id,
                username: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Unknown',
                avatar: session.user.user_metadata?.avatar
                  ? `https://cdn.discordapp.com/avatars/${session.user.id}/${session.user.user_metadata.avatar}.png`
                  : null,
                role: 'visitor',
              })
              .select()
              .single()

            if (insertError) {
              console.error('[Auth] Insert error:', insertError)
              // If insert fails, create local user object
              if (mounted) {
                setUser({
                  id: session.user.id,
                  discord_id: session.user.id,
                  username: session.user.user_metadata?.full_name || 'Unknown',
                  avatar: session.user.user_metadata?.avatar || null,
                  role: 'visitor',
                  created_at: new Date().toISOString(),
                })
                setLoading(false)
              }
            } else if (newUser && mounted) {
              console.log('[Auth] New user created:', newUser)
              setUser(newUser)
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
        // Refetch user
        supabase
          .from('users')
          .select('*')
          .eq('discord_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUser(data)
            } else {
              // Create if doesn't exist
              supabase
                .from('users')
                .insert({
                  discord_id: session.user.id,
                  username: session.user.user_metadata?.full_name || 'Unknown',
                  avatar: session.user.user_metadata?.avatar || null,
                  role: 'visitor',
                })
                .select()
                .single()
                .then(({ data }) => setUser(data))
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