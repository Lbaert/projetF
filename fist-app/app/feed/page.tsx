'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { useClipStats } from '@/hooks/useClipStats'
import { PostCard } from '@/components/PostCard'
import { AuthButton } from '@/components/AuthButton'
import { createClient } from '@/lib/supabase/client'
import type { ContentType } from '@/lib/types'

export default function FeedPage() {
  const { user, loading: authLoading, error: authError, canUpload, isAdmin } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const { posts, loading: postsLoading, loadingMore, hasMore, loadMore, refetch } = usePosts(filter)
  const { stats } = useClipStats()
  const [inverted, setInverted] = useState(false)

  const [type, setType] = useState<ContentType>('clip')
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !user && !authError) {
      router.push('/')
    }
  }, [authLoading, user, authError, router])

  useEffect(() => {
    const sentinel = document.getElementById('feed-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const handleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const handleProcessSelected = () => {
    if (selectedPosts.size === 0) return
    const ids = Array.from(selectedPosts).join(',')
    router.push(`/automation?ids=${ids}`)
  }

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedPosts(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpload) return
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', authUser?.id)
        .single()

      let finalContent = content
      let filePath: string | null = null

      if (selectedFile) {
        if (selectedFile.size > 20 * 1024 * 1024) {
          alert("FILE_TOO_LARGE: Maximum 20MB allowed. Check storage parameters on About page.")
          router.push('/about')
          return
        }

        const timestamp = Date.now()
        const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}_${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('clips')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('clips').getPublicUrl(fileName)
        finalContent = urlData.publicUrl
        filePath = fileName
      }

      const { error } = await supabase.from('posts').insert({
        user_id: dbUser?.id,
        type,
        content: finalContent,
        file_path: filePath,
      })

      if (error) throw error

      setContent('')
      setSelectedFile(null)
      setType('clip')
      refetch()
    } catch (error) {
      console.error('Upload error:', error)
      alert("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    console.log('Auth user id:', authUser?.id)

    const { data: post } = await supabase.from('posts').select('file_path, user_id').eq('id', postId).single()
    console.log('Deleting post:', post)

    if (post?.file_path) {
      const { error: storageError } = await supabase.storage.from('clips').remove([post.file_path])
      if (storageError) console.error('Storage delete error:', storageError)
    }

    const { error: dbError } = await supabase.from('posts').delete().eq('id', postId)
    if (dbError) {
      console.error('DB delete error:', dbError)
      alert(`Erreur suppression: ${dbError.message}`)
    }
    refetch()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-[#3cd7ff] font-display text-xs uppercase tracking-widest animate-pulse">
          Loading Identity...
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-red-500 font-display text-xs uppercase">Error: {authError}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <h1 className="text-5xl font-black text-[#3cd7ff] tracking-tighter font-display mb-4">
            VOTE_TERMINAL
          </h1>
          <p className="mb-8 text-neutral-500 font-display text-xs uppercase tracking-widest">
            Authentification Requise
          </p>
          <AuthButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={inverted ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}>
      {/* Top Bar */}
      <header className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left: Empty space */}
          <div className="w-20"></div>

          {/* Center: Form */}
          {canUpload && (
            <form onSubmit={handleSubmit} className="flex items-center flex-1 max-w-3xl mx-auto">
              <div className="flex items-center">
                <div className="flex gap-0">
                  {(['clip', 'music', 'reference'] as ContentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`w-14 h-14 shrink-0 flex items-center justify-center transition-all border-2 ${
                        type === t
                          ? 'bg-[#bbf600] text-black border-[#bbf600]'
                          : t === 'music'
                            ? 'border-t-zinc-800 border-b-zinc-800 border-l-zinc-800 border-r-[#0a0a0a] hover:border-t-[#bbf600]/50 hover:border-b-[#bbf600]/50 hover:border-l-[#bbf600]/50 hover:border-r-[#bbf600]/50'
                            : 'border-zinc-800 hover:border-[#bbf600]/50'
                      }`}
                    >
                      {t === 'clip' && (
                        <img
                          src="/video.webp"
                          alt="Clip"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                      {t === 'music' && (
                        <img
                          src="/audio.webp"
                          alt="Audio"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                      {t === 'reference' && (
                        <img
                          src="/texte.webp"
                          alt="Texte"
                          className="w-10 h-10 object-contain border-2 border-transparent"
                          style={{ filter: type === t ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {(type === 'clip' || type === 'music') && (
                  <>
                    <input
                      type="url"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="HTTPS://SOURCE_FEED.01"
                      disabled={!!selectedFile}
                      required={!selectedFile}
                      className="h-14 flex-1 bg-transparent border-2 border-l-transparent border-t-zinc-800 border-b-zinc-800 border-r-zinc-800 focus:border-l-[#bbf600] focus:border-t-[#bbf600] focus:border-b-[#bbf600] hover:border-l-[#bbf600] hover:border-t-[#bbf600] hover:border-b-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800 disabled:opacity-50"
                    />
                    <input
                      type="file"
                      id="file-upload"
                      accept="video/*,audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 20 * 1024 * 1024) {
                            alert("FILE_TOO_LARGE: Maximum 20MB allowed. Check storage parameters on About page.")
                            router.push('/about')
                            e.target.value = ''
                            return
                          }
                          setSelectedFile(file)
                          setContent('')
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`h-14 px-4 flex items-center justify-center cursor-pointer transition-all border-2 ${
                        selectedFile
                          ? 'bg-[#bbf600] text-black border-[#bbf600]'
                          : 'border-t-zinc-800 border-b-zinc-800 border-l-zinc-800 border-r-zinc-800 hover:border-t-[#bbf600] hover:border-b-[#bbf600] hover:border-l-[#bbf600] text-zinc-400 hover:text-[#bbf600]'
                      }`}
                    >
                      {selectedFile ? (
                        <span className="text-xs font-['Space_Grotesk'] font-bold truncate max-w-[100px]">
                          {selectedFile.name.slice(0, 12)}...
                        </span>
                      ) : (
                        <img src="/drop.webp" alt="Drop" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
                      )}
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          const input = document.getElementById('file-upload') as HTMLInputElement
                          if (input) input.value = ''
                        }}
                        className="h-14 px-2 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
                {type === 'reference' && (
                  <>
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="DESCRIBE THE ASSET..."
                      disabled={!!selectedFile}
                      required={!selectedFile}
                      className="h-14 flex-1 bg-transparent border-2 border-l-transparent border-t-zinc-800 border-b-zinc-800 border-r-zinc-800 focus:border-l-[#bbf600] focus:border-t-[#bbf600] focus:border-b-[#bbf600] hover:border-l-[#bbf600] hover:border-t-[#bbf600] hover:border-b-[#bbf600] text-white font-['Space_Grotesk'] text-sm px-4 outline-none transition-colors placeholder:text-zinc-800 disabled:opacity-50"
                    />
                    <input
                      type="file"
                      id="file-upload-ref"
                      accept="image/*,application/pdf,.txt,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 20 * 1024 * 1024) {
                            alert("FILE_TOO_LARGE: Maximum 20MB allowed. Check storage parameters on About page.")
                            router.push('/about')
                            e.target.value = ''
                            return
                          }
                          setSelectedFile(file)
                          setContent('')
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload-ref"
                      className={`h-14 px-4 flex items-center justify-center cursor-pointer transition-all border-2 ${
                        selectedFile
                          ? 'bg-[#bbf600] text-black border-[#bbf600]'
                          : 'border-t-zinc-800 border-b-zinc-800 border-l-zinc-800 border-r-zinc-800 hover:border-t-[#bbf600] hover:border-b-[#bbf600] hover:border-l-[#bbf600] text-zinc-400 hover:text-[#bbf600]'
                      }`}
                    >
                      {selectedFile ? (
                        <span className="text-xs font-['Space_Grotesk'] font-bold truncate max-w-[100px]">
                          {selectedFile.name.slice(0, 12)}...
                        </span>
                      ) : (
                        <img src="/drop.webp" alt="Drop" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
                      )}
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          const input = document.getElementById('file-upload-ref') as HTMLInputElement
                          if (input) input.value = ''
                        }}
                        className="h-14 px-2 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="h-14 px-6 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase tracking-wider hover:bg-[#a4d700] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span>INITIATE</span>
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </button>
                <span className="ml-4 text-lg text-[#C2FE0C] font-['Space_Grotesk'] font-bold shrink-0">
                  FIST: {Math.round(stats.progress)}%
                </span>
              </div>
            </form>
          )}

          {/* Right: Filters + Dashboard + User */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Dashboard Link */}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-14 h-14 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <img src="/dash.webp" alt="Dashboard" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
            </button>

            {/* About Link */}
            <button
              onClick={() => router.push('/about')}
              className="w-14 h-14 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <img src="/about.webp" alt="About" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
            </button>

            {/* Account Link */}
            <button
              onClick={() => router.push('/account')}
              className="w-14 h-14 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <img src="/membre.webp" alt="Account" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
            </button>

            {/* Invert Colors Button */}
            <button
              onClick={() => setInverted(!inverted)}
              className={`w-14 h-14 shrink-0 flex items-center justify-center transition-all ${
                inverted ? 'bg-white' : 'hover:bg-zinc-800'
              }`}
            >
              <img src="/dark.webp" alt="Dark" className="w-10 h-10 object-contain" style={{ filter: inverted ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
            </button>

            {/* Selection Mode Button */}
            {isAdmin && (
              <button
                onClick={toggleSelectionMode}
                className={`w-14 h-14 shrink-0 flex items-center justify-center transition-all ${
                  selectionMode ? 'bg-[#bbf600]' : 'hover:bg-zinc-800'
                }`}
              >
                <img src="/select.webp" alt="Select" className="w-10 h-10 object-contain" style={{ filter: selectionMode ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
              </button>
            )}

            {/* Filters */}
            <div className="flex gap-0">
              {(['all', 'clip', 'music', 'reference', 'highlight'] as (ContentType | 'all')[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`w-14 h-14 shrink-0 flex items-center justify-center transition-all ${
                    filter === f
                      ? 'bg-[#bbf600]'
                      : 'hover:bg-zinc-800'
                  }`}
                >
                  {f === 'clip' && <img src="/video.webp" alt="Clip" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
                  {f === 'music' && <img src="/audio.webp" alt="Audio" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
                  {f === 'reference' && <img src="/texte.webp" alt="Texte" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
                  {f === 'highlight' && <img src="/video.webp" alt="Highlight" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
                  {f === 'all' && <img src="/all.webp" alt="All" className="w-10 h-10 object-contain" style={{ filter: filter === f ? 'none' : 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />}
                </button>
              ))}
            </div>

            {/* Sound Button */}
            <button
              onClick={() => {
                const audio = new Audio('/mhh.ogg')
                audio.volume = 0.5
                audio.play()
              }}
              className="w-14 h-14 shrink-0 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <img src="/logo2.webp" alt="Sound" className="w-10 h-10 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
            </button>

            {/* Avatar with logout on hover */}
            <div className="relative group shrink-0 cursor-pointer w-[57px] h-[56px] bg-black flex items-center justify-center">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border-2 border-black transition-all group-hover:border-[#C2FE0C]"
                />
              )}
              <button
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="text-[#C2FE0C] text-2xl font-bold">×</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Posts Grid */}
      <div className="p-6 pb-24">
        {postsLoading ? (
          <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
            Chargement...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-center py-8 text-neutral-500 font-display text-xs uppercase">
            Aucun contenu pour le moment
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canVote={canUpload}
                  canDelete={isAdmin || post.user?.discord_id === user.discord_id}
                  onDelete={handleDelete}
                  selectionMode={selectionMode}
                  isSelected={selectedPosts.has(post.id)}
                  onSelect={handleSelectPost}
                  selectionDisabled={(post.type === 'clip' || post.type === 'music') && !post.file_path}
                />
              ))}
            </div>
            <div id="feed-sentinel" className="w-full py-8 text-center">
              {loadingMore && (
                <p className="text-zinc-500 font-display text-xs uppercase animate-pulse">
                  Chargement...
                </p>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-zinc-600 font-display text-xs uppercase">
                  Fin du feed
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Bar for Selection */}
      {selectionMode && selectedPosts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black border-2 border-[#bbf600] px-6 py-4 flex items-center gap-6">
          <span className="text-[#bbf600] font-['Space_Grotesk'] font-bold text-sm uppercase">
            {selectedPosts.size} selected
          </span>
          <button
            onClick={handleProcessSelected}
            className="px-6 py-3 bg-[#bbf600] text-black font-['Space_Grotesk'] font-black text-xs uppercase hover:bg-white transition-colors"
          >
            Lancer le montage
          </button>
          <button
            onClick={toggleSelectionMode}
            className="px-6 py-3 bg-zinc-800 text-white font-['Space_Grotesk'] font-bold text-xs uppercase hover:bg-zinc-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}