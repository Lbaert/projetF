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