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
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', authUser?.id)
        .single()

      const { error } = await supabase.from('posts').insert({
        user_id: dbUser?.id,
        type,
        content,
      })

      if (error) throw error

      setContent('')
      setType('clip')
      onSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      alert("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-black border border-zinc-800 p-6 mb-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-white uppercase">LIVE_FEED</h1>
          <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#bbf600] uppercase tracking-tight">
            Initiate Submission
          </h3>
        </div>

        <div className="flex items-center">
          <div className="flex gap-0">
            {(['clip', 'music', 'reference'] as ContentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`w-16 h-16 flex items-center justify-center transition-all ${
                  type === t
                    ? 'bg-[#bbf600] text-black border-2 border-[#bbf600]'
                    : 'border-2 border-zinc-800 hover:border-[#bbf600]/50'
                }`}
              >
                {t === 'clip' && (
                  <img
                    src="/video.webp"
                    alt="Clip"
                    className="w-14 h-14 object-contain"
                    style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                  />
                )}
                {t === 'music' && (
                  <img
                    src="/audio.webp"
                    alt="Audio"
                    className="w-14 h-14 object-contain"
                    style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                  />
                )}
                {t === 'reference' && (
                  <img
                    src="/texte.webp"
                    alt="Texte"
                    className="w-14 h-14 object-contain"
                    style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {(type === 'clip' || type === 'music') && (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="HTTPS://SOURCE_FEED.01"
              required
              className="h-16 flex-1 bg-transparent border-y-2 border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800"
            />
          )}
          {type === 'reference' && (
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="DESCRIBE THE ASSET..."
              required
              className="h-16 flex-1 bg-transparent border-y-2 border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800"
            />
          )}

          <button
            type="submit"
            disabled={uploading}
            className="h-16 px-8 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase tracking-wider hover:bg-[#a4d700] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span>INITIATE</span>
            <span className="material-symbols-outlined text-lg">bolt</span>
          </button>
        </div>
      </div>
    </form>
  )
}