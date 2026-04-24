import { Client, GatewayIntentBits } from 'discord.js'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

function getEnv(key: string): string {
  if (process.env[key]) return process.env[key]!
  const envContent = readFileSync('./.env.local', 'utf-8')
  for (const line of envContent.split('\n')) {
    const [k, ...valueParts] = line.split('=')
    if (k?.trim() === key) return valueParts.join('=').trim()
  }
  throw new Error(`Missing env var: ${key}`)
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')
const BOT_TOKEN = getEnv('DISCORD_BOT_TOKEN')
const GUILD_ID = getEnv('DISCORD_SERVER_ID')
const ROLE_LYCANTHROPE = getEnv('DISCORD_ROLE_LYCANTHROPE')
const ROLE_PRIMATE = getEnv('DISCORD_ROLE_PRIMATE')
const ROLE_SINGE = getEnv('DISCORD_ROLE_SINGE')
const ROLE_FIST = getEnv('DISCORD_ROLE_FIST')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function getRole(discordRoles: string[]): string {
  if (discordRoles.includes(ROLE_LYCANTHROPE)) return 'lycanthrope'
  if (discordRoles.includes(ROLE_PRIMATE)) return 'primate'
  if (discordRoles.includes(ROLE_SINGE)) return 'singe'
  if (discordRoles.includes(ROLE_FIST)) return 'fist'
  return 'visitor'
}

async function syncRoles() {
  console.log('Starting Discord role sync with discord.js...')

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  })

  await client.login(BOT_TOKEN)
  console.log('Bot logged in as:', client.user?.tag)

  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) {
    console.error('Guild not found:', GUILD_ID)
    process.exit(1)
  }

  console.log('Guild name:', guild.name)
  console.log('Guild member count:', guild.memberCount)

  await guild.members.fetch()
  const members = guild.members.cache.filter(m => !m.user.bot)

  console.log(`Fetched ${members.size} non-bot members`)

  const updates = members.map(m => ({
    discord_id: m.user.id,
    username: m.user.username,
    avatar: m.user.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : null,
    role: getRole(m.roles.cache.map(r => r.id)),
  }))

  console.log('Usernames:', updates.map(u => u.username))

  const { error } = await supabase.from('users').upsert(updates, {
    onConflict: 'discord_id',
  })

  if (error) {
    console.error('Supabase upsert error:', error)
    process.exit(1)
  }

  console.log(`✅ Sync complete: ${updates.length} users updated`)
  client.destroy()
}

syncRoles().catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
