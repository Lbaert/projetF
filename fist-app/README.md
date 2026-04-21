# FIST - Fistinière Highlight Platform

Collective voting platform for the La Fistinière Discord community.

## Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in the values
3. Run `npm install`
4. Run `npm run dev`
5. Visit `http://localhost:3000`

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for dev)
- `DISCORD_CLIENT_ID` - Discord application client ID
- `DISCORD_CLIENT_SECRET` - Discord application client secret
- `DISCORD_BOT_TOKEN` - Discord bot token for role verification

## Supabase Setup

1. Create a new Supabase project
2. Run the schema from `supabase/schema.sql`
3. Create a storage bucket named `soundboard`
4. Enable Discord OAuth in Supabase Auth settings

## Discord Setup

1. Create a Discord application at https://discord.com/developers
2. Add redirect URI: `{YOUR_APP_URL}/api/auth/callback`
3. Enable required scopes: `identify`, `guilds`, `guild.members.read`
4. Add your bot to the La Fistinière guild
5. Give the bot permissions to read member roles

## Features

- Discord OAuth authentication
- Role-based access control (Fist, Singe, Primate, Lycanthrope, Admin)
- Content submission: Clips, Musiques, Références, Soundboard
- Like/Dislike voting system
- Real-time score tracking
- Dashboard with statistics
- Leaderboard

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Auth + Database + Storage)
- TypeScript
- TailwindCSS