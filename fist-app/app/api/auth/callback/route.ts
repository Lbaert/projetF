import { createClient } from '@/lib/supabase/server'
import { getDiscordToken, getDiscordUser, getDiscordGuildMember, determineRole, GUILD_ID } from '@/lib/discord'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  try {
    const accessToken = await getDiscordToken(code)
    const discordUser = await getDiscordUser(accessToken)
    const guildMember = await getDiscordGuildMember(accessToken, GUILD_ID)
    const roles: string[] = guildMember.roles || []
    const role = determineRole(roles)

    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        discord_id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        role,
      }, { onConflict: 'discord_id' })
      .select()
      .single()

    if (error) throw error

    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${origin}/feed`,
      },
    })

    return NextResponse.redirect(`${origin}/feed`)
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }
}