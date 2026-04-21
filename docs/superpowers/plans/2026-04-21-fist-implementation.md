# FIST - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a collective voting platform for Fist Discord to select Hell Let Loose highlight content

**Architecture:** Next.js frontend with Supabase backend (PostgreSQL + Auth + Storage). Discord OAuth for authentication with role-based access control.

**Tech Stack:** Next.js 14, Supabase, TypeScript, TailwindCSS

---

## File Structure

```
fist-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx               # Public homepage
│   ├── feed/
│   │   └── page.tsx           # Main feed with voting/upload
│   ├── account/
│   │   └── page.tsx           # User account page
│   ├── dashboard/
│   │   └── page.tsx           # Stats dashboard
│   └── api/
│       └── auth/
│           └── callback/route.ts  # Discord OAuth callback
├── components/
│   ├── AuthButton.tsx         # Discord login button
│   ├── PostCard.tsx           # Single post display
│   ├── PostForm.tsx           # Upload form
│   ├── VoteButtons.tsx        # Like/dislike buttons
│   ├── FilterBar.tsx          # Type filters
│   ├── StatsCard.tsx          # Dashboard stat card
│   └── Leaderboard.tsx        # Participant ranking
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware
│   ├── discord.ts             # Discord API helpers
│   └── types.ts               # TypeScript types
├── hooks/
│   ├── useAuth.ts             # Auth hook
│   └── usePosts.ts            # Posts CRUD hook
├── types/
│   └── database.ts            # Supabase types
└── docs/
    └── SUPERPOWERS.md         # This plan
```

---

## Task 1: Project Setup

**Files:**
- Create: `fist-app/package.json`
- Create: `fist-app/next.config.js`
- Create: `fist-app/tsconfig.json`
- Create: `fist-app/tailwind.config.ts`
- Create: `fist-app/.env.local.example`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest fist-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --yes
```

- [ ] **Step 2: Install dependencies**

```bash
cd fist-app && npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs discord.js
npm install -D @types/node
```

- [ ] **Step 3: Create environment example**

```bash
cat > .env.local.example << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_bot_token
EOF
```

- [ ] **Step 4: Commit**

```bash
git add package.json next.config.js tsconfig.json tailwind.config.ts .env.local.example
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: Supabase Setup

**Files:**
- Create: `fist-app/supabase/schema.sql`

- [ ] **Step 1: Create database schema**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'visitor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('clip', 'music', 'reference', 'soundboard')),
  content TEXT NOT NULL,
  file_path VARCHAR(500),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can create votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
```

- [ ] **Step 2: Create storage bucket**

```sql
-- Run in Supabase dashboard or via API
INSERT INTO storage.buckets (id, name, public) VALUES ('soundboard', 'soundboard', true);

CREATE POLICY "Anyone can upload to soundboard" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'soundboard' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view soundboard" ON storage.objects
FOR SELECT USING (bucket_id = 'soundboard');
```

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase database schema"
```

---

## Task 3: Supabase Client Setup

**Files:**
- Create: `fist-app/lib/supabase/client.ts`
- Create: `fist-app/lib/supabase/server.ts`
- Create: `fist-app/lib/supabase/middleware.ts`
- Create: `fist-app/lib/types.ts`

- [ ] **Step 1: Create browser Supabase client**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server Supabase client**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create middleware**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return supabaseResponse
}
```

- [ ] **Step 4: Create types**

```typescript
export type ContentType = 'clip' | 'music' | 'reference' | 'soundboard'

export type Role = 'visitor' | 'fist' | 'singe' | 'primate' | 'lycanthrope' | 'admin'

export interface User {
  id: string
  discord_id: string
  username: string
  avatar: string | null
  role: Role
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  type: ContentType
  content: string
  file_path: string | null
  score: number
  created_at: string
  updated_at: string
  user?: User
}

export interface Vote {
  id: string
  post_id: string
  user_id: string
  value: 1 | -1
  created_at: string
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/ lib/types.ts
git commit -m "feat: setup Supabase clients and types"
```

---

## Task 4: Discord OAuth Setup

**Files:**
- Create: `fist-app/lib/discord.ts`
- Modify: `fist-app/app/api/auth/callback/route.ts`
- Modify: `fist-app/middleware.ts`

- [ ] **Step 1: Create Discord helper**

```typescript
const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!
const DISCORD_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`

export async function getDiscordAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds guild.members.read',
    state,
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

export async function getDiscordToken(code: string): Promise<string> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
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

export async function getDiscordGuildRoles(accessToken: string, guildId: string) {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

// Role IDs from spec
export const ROLE_IDS = {
  FIST: '1459634951891980451',
  SINGE: '809815744577536050',
  PRIMATE: '1453063817603846277',
  LYCANTHROPE: '1413621899044327434',
} as const

export const GUILD_ID = '809526179643392100' // La Fistinière
export const ADMIN_ID = '770068277044707335'

export function determineRole(roles: string[]): Role {
  if (roles.includes(ADMIN_ID)) return 'admin'
  if (roles.includes(ROLE_IDS.LYCANTHROPE)) return 'lycanthrope'
  if (roles.includes(ROLE_IDS.PRIMATE)) return 'primate'
  if (roles.includes(ROLE_IDS.FIST)) return 'fist'
  if (roles.includes(ROLE_IDS.SINGE)) return 'singe'
  return 'visitor'
}
```

- [ ] **Step 2: Create OAuth callback route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { getDiscordToken, getDiscordUser, getDiscordGuildRoles, determineRole, GUILD_ID } from '@/lib/discord'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  try {
    // Exchange code for token
    const accessToken = await getDiscordToken(code)

    // Get Discord user
    const discordUser = await getDiscordUser(accessToken)

    // Get user's guild roles
    const guildMember = await getDiscordGuildRoles(accessToken, GUILD_ID)
    const roles: string[] = guildMember.roles || []

    // Determine role
    const role = determineRole(roles)

    // Upsert user in Supabase
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        discord_id: discordUser.id,
        username: discordUser.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
        role,
      }, { onConflict: 'discord_id' })
      .select()
      .single()

    if (error) throw error

    // Create session
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
```

- [ ] **Step 3: Update middleware**

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/discord.ts app/api/auth/callback/route.ts middleware.ts
git commit -m "feat: implement Discord OAuth authentication"
```

---

## Task 5: Auth Components

**Files:**
- Create: `fist-app/components/AuthButton.tsx`
- Create: `fist-app/hooks/useAuth.ts`
- Modify: `fist-app/app/layout.tsx`

- [ ] **Step 1: Create useAuth hook**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', authUser.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', session.user.id)
          .single()
        setUser(data)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const canUpload = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const canVote = user?.role === 'primate' || user?.role === 'lycanthrope' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return { user, loading, canUpload, canVote, isAdmin }
}
```

- [ ] **Step 2: Create AuthButton component**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-[#4B5320] text-white font-bold rounded hover:bg-[#3a3f18] transition-colors"
    >
      Se connecter avec Discord
    </button>
  )
}
```

- [ ] **Step 3: Update root layout**

```typescript
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FIST - Fistinière Highlight',
  description: 'Collective voting platform for Fist Discord',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-[#1A1A1A] text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/AuthButton.tsx hooks/useAuth.ts app/layout.tsx
git commit -m "feat: add auth components and layout"
```

---

## Task 6: PostCard Component

**Files:**
- Create: `fist-app/components/PostCard.tsx`
- Create: `fist-app/components/VoteButtons.tsx`

- [ ] **Step 1: Create VoteButtons component**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VoteButtonsProps {
  postId: string
  initialScore: number
  userVote: 1 | -1 | null
  canVote: boolean
}

export function VoteButtons({ postId, initialScore, userVote, canVote }: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore)
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleVote = async (value: 1 | -1) => {
    if (!canVote || loading) return
    setLoading(true)

    try {
      if (currentVote === value) {
        // Remove vote
        await supabase.from('votes').delete()
          .match({ post_id: postId })
        setScore(score - value)
        setCurrentVote(null)
      } else if (currentVote === null) {
        // Add vote
        await supabase.from('votes').insert({ post_id: postId, value })
        setScore(score + value)
        setCurrentVote(value)
      } else {
        // Change vote
        await supabase.from('votes').update({ value })
          .match({ post_id: postId })
        setScore(score + (value * 2))
        setCurrentVote(value)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={!canVote || loading}
        className={`px-3 py-1 rounded font-bold transition-colors ${
          currentVote === 1
            ? 'bg-green-600 text-white'
            : 'bg-[#4A4A4A] hover:bg-green-700'
        } disabled:opacity-50`}
      >
        👍 {score > 0 ? `+${score}` : score}
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={!canVote || loading}
        className={`px-3 py-1 rounded font-bold transition-colors ${
          currentVote === -1
            ? 'bg-red-700 text-white'
            : 'bg-[#4A4A4A] hover:bg-red-700'
        } disabled:opacity-50`}
      >
        👎
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create PostCard component**

```typescript
import { VoteButtons } from './VoteButtons'
import type { Post, User } from '@/lib/types'

interface PostCardProps {
  post: Post & { user: User; user_vote?: 1 | -1 }
  canVote: boolean
  canDelete: boolean
  onDelete: (postId: string) => void
}

export function PostCard({ post, canVote, canDelete, onDelete }: PostCardProps) {
  const typeLabels = {
    clip: '🎬 Clip',
    music: '🎵 Musique',
    reference: '💬 Référence',
    soundboard: '🔊 Soundboard',
  }

  return (
    <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={post.user?.avatar || '/default-avatar.png'}
          alt={post.user?.username}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-bold text-[#C9A227]">{post.user?.username}</p>
          <p className="text-sm text-[#71717A]">{typeLabels[post.type]}</p>
        </div>
      </div>

      {post.type === 'soundboard' && post.file_path ? (
        <audio controls src={post.file_path} className="w-full mb-3" />
      ) : (
        <p className="text-lg mb-3 break-all">{post.content}</p>
      )}

      <div className="flex items-center justify-between">
        <VoteButtons
          postId={post.id}
          initialScore={post.score}
          userVote={post.user_vote || null}
          canVote={canVote}
        />
        {canDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-red-500 hover:text-red-400 text-sm"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PostCard.tsx components/VoteButtons.tsx
git commit -m "feat: add PostCard and VoteButtons components"
```

---

## Task 7: Feed Page with Upload

**Files:**
- Create: `fist-app/components/PostForm.tsx`
- Create: `fist-app/components/FilterBar.tsx`
- Create: `fist-app/hooks/usePosts.ts`
- Modify: `fist-app/app/feed/page.tsx`
- Modify: `fist-app/app/page.tsx`

- [ ] **Step 1: Create FilterBar component**

```typescript
'use client'

import type { ContentType } from '@/lib/types'

interface FilterBarProps {
  selected: ContentType | 'all'
  onChange: (type: ContentType | 'all') => void
}

export function FilterBar({ selected, onChange }: FilterBarProps) {
  const filters: { value: ContentType | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'clip', label: '🎬 Clips' },
    { value: 'music', label: '🎵 Musiques' },
    { value: 'reference', label: '💬 Références' },
    { value: 'soundboard', label: '🔊 Soundboard' },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-4 py-2 rounded font-bold transition-colors ${
            selected === filter.value
              ? 'bg-[#C9A227] text-black'
              : 'bg-[#4A4A4A] hover:bg-[#5A5A5A]'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create PostForm component**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContentType } from '@/lib/types'

interface PostFormProps {
  onSuccess: () => void
}

export function PostForm({ onSuccess }: PostFormProps) {
  const [type, setType] = useState<ContentType>('clip')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let filePath = null

      // Upload file if soundboard
      if (type === 'soundboard' && file) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('soundboard')
          .upload(`${Date.now()}-${file.name}`, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('soundboard')
          .getPublicUrl(uploadData.path)

        filePath = publicUrl
      }

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', authUser?.id)
        .single()

      // Insert post
      const { error } = await supabase.from('posts').insert({
        user_id: dbUser?.id,
        type,
        content: type === 'soundboard' ? file!.name : content,
        file_path: filePath,
      })

      if (error) throw error

      setContent('')
      setFile(null)
      setType('clip')
      onSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4 mb-6">
      <h3 className="text-xl font-bold text-[#C9A227] mb-4">Proposer du contenu</h3>

      <div className="mb-4">
        <label className="block text-sm mb-2">Type de contenu</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ContentType)}
          className="w-full bg-[#1A1A1A] border border-[#4A4A4A] rounded px-3 py-2 text-white"
        >
          <option value="clip">🎬 Clip YouTube</option>
          <option value="music">🎵 Musique YouTube</option>
          <option value="reference">💬 Référence (texte)</option>
          <option value="soundboard">🔊 Soundboard (MP3)</option>
        </select>
      </div>

      {(type === 'clip' || type === 'music') && (
        <div className="mb-4">
          <label className="block text-sm mb-2">Lien YouTube</label>
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className="w-full bg-[#1A1A1A] border border-[#4A4A4A] rounded px-3 py-2 text-white"
          />
        </div>
      )}

      {type === 'reference' && (
        <div className="mb-4">
          <label className="block text-sm mb-2">Référence</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ta private joke..."
            required
            rows={3}
            className="w-full bg-[#1A1A1A] border border-[#4A4A4A] rounded px-3 py-2 text-white resize-none"
          />
        </div>
      )}

      {type === 'soundboard' && (
        <div className="mb-4">
          <label className="block text-sm mb-2">Fichier MP3 (max 10MB)</label>
          <input
            type="file"
            accept=".mp3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full bg-[#1A1A1A] border border-[#4A4A4A] rounded px-3 py-2 text-white"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
      >
        {uploading ? 'Upload en cours...' : 'Publier'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create usePosts hook**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Post, ContentType } from '@/lib/types'

export function usePosts(type: ContentType | 'all' = 'all') {
  const [posts, setPosts] = useState<(Post & { user: any; user_vote?: 1 | -1 })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          votes(value, user_id)
        `)
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) throw error

      // Get current user vote for each post
      const { data: { user: authUser } } = await supabase.auth.getUser()
      let userVote = null
      if (authUser) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('discord_id', authUser.id)
          .single()
        userVote = dbUser?.id
      }

      const postsWithVotes = (data || []).map((post: any) => ({
        ...post,
        user_vote: post.votes?.find((v: any) => v.user_id === userVote)?.value || null,
      }))

      setPosts(postsWithVotes)
    } catch (error) {
      console.error('Fetch posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [type])

  return { posts, loading, refetch: fetchPosts }
}
```

- [ ] **Step 4: Create Feed page**

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { PostCard } from '@/components/PostCard'
import { PostForm } from '@/components/PostForm'
import { FilterBar } from '@/components/FilterBar'
import { AuthButton } from '@/components/AuthButton'
import type { ContentType } from '@/lib/types'

export default function FeedPage() {
  const { user, loading: authLoading, canUpload, isAdmin } = useAuth()
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const { posts, loading: postsLoading, refetch } = usePosts(filter)

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    refetch()
  }

  if (authLoading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#C9A227] mb-4">FIST</h1>
          <p className="mb-6 text-[#71717A]">Connecte-toi pour participer</p>
          <AuthButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">FIST - Feed</h1>
        <div className="flex items-center gap-4">
          <img src={user.avatar || ''} alt={user.username} className="w-10 h-10 rounded-full" />
          <span className="font-bold text-[#C9A227]">{user.username}</span>
        </div>
      </header>

      {canUpload && <PostForm onSuccess={refetch} />}

      <FilterBar selected={filter} onChange={setFilter} />

      {postsLoading ? (
        <p className="text-center py-8 text-[#71717A]">Chargement...</p>
      ) : posts.length === 0 ? (
        <p className="text-center py-8 text-[#71717A]">Aucun contenu pour le moment</p>
      ) : (
        <div className="grid gap-4 mt-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canVote={canUpload}
              canDelete={isAdmin || post.user?.discord_id === user.discord_id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Update homepage**

```typescript
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#C9A227] mb-4">FIST</h1>
        <p className="text-xl text-[#8B0000] mb-8">La Fistinière - Hell Let Loose</p>
        <p className="text-[#71717A] mb-6">Collective highlight voting platform</p>
        <Link
          href="/feed"
          className="inline-block px-6 py-3 bg-[#4B5320] text-white font-bold rounded hover:bg-[#3a3f18] transition-colors"
        >
          Entrer
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/PostForm.tsx components/FilterBar.tsx hooks/usePosts.ts app/feed/page.tsx app/page.tsx
git commit -m "feat: implement feed page with upload and voting"
```

---

## Task 8: Account Page

**Files:**
- Create: `fist-app/app/account/page.tsx`

- [ ] **Step 1: Create Account page**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth()
  const [myPosts, setMyPosts] = useState<(Post & { user: any })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchMyPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, user:users(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMyPosts(data || [])
      setLoading(false)
    }

    fetchMyPosts()
  }, [user])

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setMyPosts(myPosts.filter((p) => p.id !== postId))
  }

  if (authLoading || loading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user) {
    return <div className="p-8 text-center">Non connecté</div>
  }

  const totalScore = myPosts.reduce((acc, post) => acc + post.score, 0)

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">Mon Compte</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Posts</p>
          <p className="text-3xl font-bold text-[#C9A227]">{myPosts.length}</p>
        </div>
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Score total</p>
          <p className="text-3xl font-bold text-[#C9A227]">{totalScore}</p>
        </div>
        <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
          <p className="text-[#71717A]">Rôle</p>
          <p className="text-xl font-bold text-[#8B0000]">{user.role}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Mes Posts</h2>
      {myPosts.length === 0 ? (
        <p className="text-[#71717A]">Aucun post pour le moment</p>
      ) : (
        <div className="grid gap-4">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4 flex justify-between items-center">
              <div>
                <span className="text-[#71717A] text-sm">[{post.type}]</span>
                <p className="mt-1">{post.content}</p>
                <p className="text-sm text-[#71717A]">Score: {post.score}</p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-red-500 hover:text-red-400"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: add account page with personal stats"
```

---

## Task 9: Dashboard Page

**Files:**
- Create: `fist-app/components/StatsCard.tsx`
- Create: `fist-app/components/Leaderboard.tsx`
- Create: `fist-app/app/dashboard/page.tsx`

- [ ] **Step 1: Create StatsCard component**

```typescript
interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
      <p className="text-[#71717A] text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-[#C9A227]">
        {icon && <span className="mr-2">{icon}</span>}
        {value}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create Leaderboard component**

```typescript
interface Participant {
  username: string
  avatar: string
  postCount: number
  totalScore: number
}

interface LeaderboardProps {
  participants: Participant[]
}

export function Leaderboard({ participants }: LeaderboardProps) {
  return (
    <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
      <h3 className="text-xl font-bold text-[#C9A227] mb-4">Classement Participants</h3>
      {participants.length === 0 ? (
        <p className="text-[#71717A]">Aucune donnée</p>
      ) : (
        <div className="space-y-2">
          {participants.slice(0, 10).map((p, index) => (
            <div key={p.username} className="flex items-center gap-3 p-2 bg-[#1A1A1A] rounded">
              <span className="w-6 text-center font-bold text-[#71717A]">#{index + 1}</span>
              <img src={p.avatar} alt={p.username} className="w-8 h-8 rounded-full" />
              <span className="flex-1 font-bold">{p.username}</span>
              <span className="text-[#71717A]">{p.postCount} posts</span>
              <span className="text-[#C9A227] font-bold">{p.totalScore} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create Dashboard page**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/StatsCard'
import { Leaderboard } from '@/components/Leaderboard'

export default function DashboardPage() {
  const { user, loading: authLoading, canUpload, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalParticipants: 0,
    totalVotes: 0,
    byType: { clip: 0, music: 0, reference: 0, soundboard: 0 },
  })
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user || !canUpload) return

    const fetchStats = async () => {
      // Fetch all posts with users and votes
      const { data: posts } = await supabase
        .from('posts')
        .select('*, user:users(*), votes(value)')

      if (posts) {
        // Total stats
        setStats({
          totalPosts: posts.length,
          totalParticipants: new Set(posts.map((p: any) => p.user_id)).size,
          totalVotes: posts.reduce((acc: number, p: any) => acc + (p.votes?.length || 0), 0),
          byType: {
            clip: posts.filter((p: any) => p.type === 'clip').length,
            music: posts.filter((p: any) => p.type === 'music').length,
            reference: posts.filter((p: any) => p.type === 'reference').length,
            soundboard: posts.filter((p: any) => p.type === 'soundboard').length,
          },
        })

        // Build participant rankings
        const userMap = new Map<string, any>()
        posts.forEach((post: any) => {
          if (!userMap.has(post.user_id)) {
            userMap.set(post.user_id, {
              username: post.user?.username,
              avatar: post.user?.avatar,
              postCount: 0,
              totalScore: 0,
            })
          }
          const u = userMap.get(post.user_id)
          u.postCount++
          u.totalScore += post.score
        })

        setParticipants(
          Array.from(userMap.values()).sort((a, b) => b.totalScore - a.totalScore)
        )
      }

      setLoading(false)
    }

    fetchStats()
  }, [user, canUpload])

  if (authLoading || loading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (!user || !canUpload) {
    return <div className="p-8 text-center">Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#C9A227]">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Posts" value={stats.totalPosts} icon="📝" />
        <StatsCard title="Participants" value={stats.totalParticipants} icon="👥" />
        <StatsCard title="Total Votes" value={stats.totalVotes} icon="🗳️" />
        <StatsCard
          title="Score Moyen"
          value={stats.totalPosts ? Math.round(stats.totalVotes / stats.totalPosts * 10) / 10 : 0}
          icon="📊"
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Répartition par Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard title="🎬 Clips" value={stats.byType.clip} />
        <StatsCard title="🎵 Musiques" value={stats.byType.music} />
        <StatsCard title="💬 Références" value={stats.byType.reference} />
        <StatsCard title="🔊 Soundboard" value={stats.byType.soundboard} />
      </div>

      <Leaderboard participants={participants} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/StatsCard.tsx components/Leaderboard.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard with stats and leaderboard"
```

---

## Task 10: Navigation & Polish

**Files:**
- Modify: `fist-app/app/layout.tsx`
- Create: `fist-app/components/Navbar.tsx`

- [ ] **Step 1: Create Navbar component**

```typescript
'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, canUpload } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-[#2A2A2A] border-b border-[#4A4A4A] px-6 py-3 flex items-center justify-between">
      <Link href="/feed" className="text-xl font-bold text-[#C9A227]">
        FIST
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/feed"
          className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
        >
          Feed
        </Link>
        <Link
          href="/account"
          className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
        >
          Compte
        </Link>
        {canUpload && (
          <Link
            href="/dashboard"
            className="px-3 py-1 rounded hover:bg-[#4A4A4A] transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update layout with Navbar**

```typescript
import './globals.css'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'FIST - Fistinière Highlight',
  description: 'Collective voting platform for Fist Discord',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-[#1A1A1A] text-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Navbar.tsx app/layout.tsx
git commit -m "feat: add navigation navbar"
```

---

## Task 11: Environment & README

**Files:**
- Create: `fist-app/.env.local`
- Create: `fist-app/README.md`

- [ ] **Step 1: Create README**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Verify all pages load**

```bash
npm run build
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete FIST platform implementation"
```
