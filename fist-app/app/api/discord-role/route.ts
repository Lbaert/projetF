import { createClient } from '@/lib/supabase/server'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID
const DISCORD_ROLE_LYCANTHROPE = process.env.DISCORD_ROLE_LYCANTHROPE
const DISCORD_ROLE_PRIMATE = process.env.DISCORD_ROLE_PRIMATE
const DISCORD_ROLE_SINGE = process.env.DISCORD_ROLE_SINGE
const DISCORD_ROLE_FIST = process.env.DISCORD_ROLE_FIST

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('[Discord Role] Supabase User Auth:', authUser ? 'OK' : 'FAIL')

    const discordUserId = authUser.user_metadata?.sub || authUser.user_metadata?.provider_id

    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
      return Response.json({ error: 'Discord not configured' }, { status: 500 })
    }

    if (!discordUserId) {
      return Response.json({ error: 'Discord ID not found' }, { status: 400 })
    }

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    )

    console.log('[Discord Role] Statut réponse Discord:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Discord Role] Erreur API Discord:', errorText)
      return Response.json({ error: 'Discord error', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    const roleIds: string[] = data.roles || []

    let appRole: 'visitor' | 'singe' | 'primate' | 'lycanthrope' | 'admin' = 'visitor'

    if (roleIds.includes(DISCORD_ROLE_FIST || '')) appRole = 'admin'
    else if (roleIds.includes(DISCORD_ROLE_LYCANTHROPE || '')) appRole = 'lycanthrope'
    else if (roleIds.includes(DISCORD_ROLE_PRIMATE || '')) appRole = 'primate'
    else if (roleIds.includes(DISCORD_ROLE_SINGE || '')) appRole = 'singe'

    console.log('[Discord Role] Rôles reçus de Discord :', roleIds)
    console.log('[Discord Role] Rôle calculé pour Supabase :', appRole)

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: appRole })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('[Discord Role] Update error:', updateError)
      return Response.json({ error: 'DB update failed' }, { status: 500 })
    }

    return Response.json({ role: appRole })
  } catch (error) {
    console.error('[Discord Role] Error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
