import { REST, Routes } from 'discord.js'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('./.env.local', 'utf-8')
const envVars: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
}

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_ANON_KEY = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const SUPABASE_SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']
const BOT_TOKEN = envVars['DISCORD_BOT_TOKEN']
const GUILD_ID = envVars['DISCORD_SERVER_ID']
const ROLE_LYCANTHROPE = envVars['DISCORD_ROLE_LYCANTHROPE']
const ROLE_PRIMATE = envVars['DISCORD_ROLE_PRIMATE']
const ROLE_SINGE = envVars['DISCORD_ROLE_SINGE']
const ROLE_FIST = envVars['DISCORD_ROLE_FIST']

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function getRole(discordRoles: string[]): string {
  if (discordRoles.includes(ROLE_LYCANTHROPE)) return 'lycanthrope'
  if (discordRoles.includes(ROLE_PRIMATE)) return 'primate'
  if (discordRoles.includes(ROLE_SINGE)) return 'singe'
  if (discordRoles.includes(ROLE_FIST)) return 'fist'
  return 'visitor'
}

async function syncRoles() {
  console.log('Starting Discord role sync...')
  console.log('Guild ID:', GUILD_ID)

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN)

  const response = await rest.get(
    Routes.guildMembers(GUILD_ID),
    { query: { limit: 1000 } }
  ) as any[]

  console.log('Response type:', typeof response, 'isArray:', Array.isArray(response))
  console.log('Response length:', response?.length)
  if (response && response.length > 0) {
    console.log('First member keys:', Object.keys(response[0]))
    console.log('First member user:', response[0].user?.username, response[0].user?.id)
  }

  const updates = (response || [])
    .filter((m: any) => !m.user?.bot)
    .map((m: any) => ({
      discord_id: m.user.id,
      username: m.user.username,
      avatar: m.user.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : null,
      role: getRole(m.roles || []),
    }))

  console.log(`Upserting ${updates.length} users...`)

  const { error } = await supabase.from('users').upsert(updates, {
    onConflict: 'discord_id',
  })

  if (error) {
    console.error('Supabase upsert error:', error)
    process.exit(1)
  }

  console.log(`✅ Sync complete: ${updates.length} users updated`)
}

syncRoles().catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
