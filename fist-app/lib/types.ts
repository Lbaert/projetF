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