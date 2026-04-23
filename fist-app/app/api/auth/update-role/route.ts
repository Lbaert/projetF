import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DISCORD_API = 'https://discord.com/api/v10'
const GUILD_ID = '809526179643392100'
const ADMIN_ID = '770068277044707335'

const ROLE_IDS = {
  FIST: '1459634951891980451',
  SINGE: '809815744577536050',
  PRIMATE: '1453063817603846277',
  LYCANTHROPE: '1413621899044327434',
} as const

function determineRole(roles: string[]): string {
  if (roles.includes(ADMIN_ID)) return 'admin'
  if (roles.includes(ROLE_IDS.LYCANTHROPE)) return 'lycanthrope'
  if (roles.includes(ROLE_IDS.PRIMATE)) return 'primate'
  if (roles.includes(ROLE_IDS.FIST)) return 'fist'
  if (roles.includes(ROLE_IDS.SINGE)) return 'singe'
  return 'visitor'
}

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the current session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the Discord access token from the provider metadata
    const providerToken = user.user_metadata?.provider_token
    const discordId = user.user_metadata?.sub

    if (!providerToken) {
      return NextResponse.json({ error: 'No Discord token found' }, { status: 400 })
    }

    // Fetch guild member data from Discord
    const guildResponse = await fetch(
      `${DISCORD_API}/users/@me/guilds/${GUILD_ID}/member`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      }
    )

    if (!guildResponse.ok) {
      // User might not be in the guild
      return NextResponse.json({ role: 'visitor' })
    }

    const guildMember = await guildResponse.json()
    const roles: string[] = guildMember.roles || []
    const role = determineRole(roles)

    // Update user role in our database
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update role error:', updateError)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ role, success: true })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}