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

      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', authUser?.id)
        .single()

      const { error } = await supabase.from('posts').insert({
        user_id: dbUser?.id,
        type,
        content: type === 'soundboard' && file ? file.name : content,
        file_path: filePath,
      })

      if (error) throw error

      setContent('')
      setFile(null)
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
    <form onSubmit={handleSubmit} className="bg-black border border-zinc-800 p-6 mb-8">
      <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#bbf600] uppercase mb-6 tracking-tight">
        Initiate Submission
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase block mb-2 tracking-widest">
            Payload Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['clip', 'music', 'reference', 'soundboard'] as ContentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2 font-['Space_Grotesk'] text-xs font-medium uppercase flex items-center gap-2 transition-all ${
                  type === t
                    ? 'bg-[#bbf600] text-black border border-[#bbf600]'
                    : 'border border-zinc-800 text-zinc-400 hover:border-[#bbf600]/50 hover:text-white'
                }`}
              >
                {t === 'clip' && '🎬'}
                {t === 'music' && '🎵'}
                {t === 'reference' && '💬'}
                {t === 'soundboard' && '🔊'}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase block mb-2 tracking-widest">
            Source URL
          </label>
          {(type === 'clip' || type === 'music') && (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="HTTPS://SOURCE_FEED.01"
              required
              className="w-full bg-transparent border border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm p-3 outline-none transition-colors placeholder:text-zinc-800"
            />
          )}

          {type === 'reference' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="DESCRIBE THE ASSET..."
              required
              rows={3}
              className="w-full h-full bg-zinc-900/50 border border-zinc-800 focus:border-[#bbf600] text-white font-['Space_Grotesk'] text-sm p-3 outline-none transition-colors placeholder:text-zinc-800 resize-none"
            />
          )}

          {type === 'soundboard' && (
            <input
              type="file"
              accept=".mp3"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full bg-transparent border border-zinc-800 text-zinc-400 font-['Space_Grotesk'] text-xs p-3 file:mr-4 file:py-1 file:px-3 file:border file:border-zinc-700 file:text-xs file:font-['Space_Grotesk'] file:uppercase file:bg-zinc-800 file:text-zinc-300 hover:file:border-[#bbf600]"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={uploading}
          className="px-8 py-3 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase tracking-wider hover:bg-[#a4d700] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>INITIATE SUBMISSION</span>
          <span className="material-symbols-outlined text-lg">bolt</span>
        </button>
        <span className="text-[10px] font-['Space_Grotesk'] text-zinc-600 uppercase">
          {uploading ? 'Processing...' : 'Awaiting Input'}
        </span>
      </div>
    </form>
  )
}