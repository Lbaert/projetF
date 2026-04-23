import { createClient } from '@/lib/supabase/client'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const FIST_SERVER_ID = process.env.DISCORD_SERVER_ID

export interface DiscordRole {
  id: string
  name: string
  position: number
}

export interface DiscordMember {
  user_id: string
  roles: string[]
}

export async function getDiscordMember(discordUserId: string): Promise<DiscordMember | null> {
  if (!DISCORD_BOT_TOKEN || !FIST_SERVER_ID) {
    console.warn('Discord bot not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${FIST_SERVER_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[Discord] User not found in server')
        return null
      }
      console.error('[Discord] API error:', response.status)
      return null
    }

    const data = await response.json()
    return {
      user_id: data.user.id,
      roles: data.roles,
    }
  } catch (error) {
    console.error('[Discord] Fetch error:', error)
    return null
  }
}

export async function getDiscordRoles(): Promise<DiscordRole[]> {
  if (!DISCORD_BOT_TOKEN || !FIST_SERVER_ID) {
    return []
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${FIST_SERVER_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      console.error('[Discord] Roles API error:', response.status)
      return []
    }

    const data = await response.json()
    return data
      .map((role: any) => ({
        id: role.id,
        name: role.name,
        position: role.position,
      }))
      .sort((a: DiscordRole, b: DiscordRole) => b.position - a.position)
  } catch (error) {
    console.error('[Discord] Roles fetch error:', error)
    return []
  }
}

export function mapDiscordRolesToAppRole(discordRoleIds: string[], allRoles: DiscordRole[]): 'visitor' | 'singe' | 'primate' | 'lycanthrope' | 'admin' {
  const roleNames = discordRoleIds
    .map(id => allRoles.find(r => r.id === id)?.name.toLowerCase())
    .filter(Boolean)

  if (roleNames.includes('admin')) return 'admin'
  if (roleNames.includes('lycanthrope')) return 'lycanthrope'
  if (roleNames.includes('primate')) return 'primate'
  if (roleNames.includes('singe')) return 'singe'

  return 'visitor'
}
