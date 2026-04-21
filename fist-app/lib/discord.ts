import type { Role } from './types'

const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!

export async function getDiscordAuthUrl(state: string): Promise<string> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds guild.members.read',
    state,
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

export async function getDiscordToken(code: string): Promise<string> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  const data = await response.json()
  return data.access_token
}

export async function getDiscordUser(accessToken: string) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

export async function getDiscordGuildMember(accessToken: string, guildId: string) {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

export const ROLE_IDS = {
  FIST: '1459634951891980451',
  SINGE: '809815744577536050',
  PRIMATE: '1453063817603846277',
  LYCANTHROPE: '1413621899044327434',
} as const

export const GUILD_ID = '809526179643392100'
export const ADMIN_ID = '770068277044707335'

export function determineRole(roles: string[]): Role {
  if (roles.includes(ADMIN_ID)) return 'admin'
  if (roles.includes(ROLE_IDS.LYCANTHROPE)) return 'lycanthrope'
  if (roles.includes(ROLE_IDS.PRIMATE)) return 'primate'
  if (roles.includes(ROLE_IDS.FIST)) return 'fist'
  if (roles.includes(ROLE_IDS.SINGE)) return 'singe'
  return 'visitor'
}