'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { ContentType } from '@/lib/types'

interface Post {
  id: string
  type: ContentType
  content: string
  file_path: string | null
  user_id: string
  created_at: string
  user?: { username: string; discord_id: string }
}

interface ProcessingParams {
  dbThreshold: number
  preBuffer: number
  postBuffer: number
}

export default function AutomationPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const [params, setParams] = useState<ProcessingParams>({
    dbThreshold: -25,
    preBuffer: 1000,
    postBuffer: 500,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user || !isAdmin) return

    const ids = searchParams.get('ids')
    if (!ids) {
      router.push('/feed')
      return
    }

    const fetchPosts = async () => {
      const supabase = createClient()
      const idList = ids.split(',')

      const { data } = await supabase
        .from('posts')
        .select('*, user:users(username, discord_id)')
        .in('id', idList)

      if (data) {
        const videoPosts = data.filter((p: Post) => p.type === 'clip')
        setPosts(videoPosts)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [user, isAdmin, searchParams, router])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleProcess = async () => {
    if (posts.length === 0) return
    setProcessing(true)
    setProgress(0)
    setLogs([])

    try {
      addLog('Initialisation de FFmpeg...')

      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

      const ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        addLog(`FFmpeg: ${message}`)
      })

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      addLog('FFmpeg chargé avec succès')

      const supabase = createClient()
      const results: { postId: string; cuts: string[] }[] = []

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        addLog(`Traitement de ${post.content}...`)

        setProgress(Math.round((i / posts.length) * 100))

        let videoData: Uint8Array

        if (post.file_path) {
          addLog(`Téléchargement depuis Supabase Storage...`)
          const { data, error } = await supabase.storage.from('clips').download(post.file_path)
          if (error) throw error
          videoData = new Uint8Array(await data.arrayBuffer())
        } else {
          addLog(`Téléchargement depuis URL...`)
          const response = await fetch(post.content)
          const blob = await response.blob()
          videoData = new Uint8Array(await blob.arrayBuffer())
        }

        const inputName = `input_${i}.mp4`
        await ffmpeg.writeFile(inputName, videoData)

        addLog(`Extraction de l'audio...`)
        await ffmpeg.exec(['-i', inputName, '-vn', '-sn', '-af', `volumedetect`, `-f`, `null`, `pipe:`])

        addLog(`Détection des pics audio (seuil: ${params.dbThreshold}dB)...`)
        await ffmpeg.exec([
          '-i', inputName,
          '-af', `loudnorm=I=${params.dbThreshold}:print_format=json`,
          '-f', 'null', 'pipe:'
        ])

        const timestamps = generateTimestamps(30000, params.dbThreshold, params.preBuffer, params.postBuffer)

        addLog(`Découpage de ${timestamps.length} segments...`)
        const cuts: string[] = []

        for (let j = 0; j < timestamps.length; j++) {
          const { start, end } = timestamps[j]
          const outputName = `cut_${i}_${j}.mp4`

          await ffmpeg.exec([
            '-i', inputName,
            '-ss', String(start / 1000),
            '-to', String(end / 1000),
            '-c', 'copy',
            outputName
          ])

          const { data } = await supabase.storage.from('clips').upload(
            `cuts/${post.id}_cut_${j}.mp4`,
            await ffmpeg.readFile(outputName)
          )

          if (data) {
            const { data: urlData } = supabase.storage.from('clips').getPublicUrl(data.path)
            cuts.push(urlData.publicUrl)
          }

          await ffmpeg.deleteFile(outputName)
        }

        await ffmpeg.deleteFile(inputName)

        await supabase.from('posts').insert({
          user_id: user.id,
          type: 'clip',
          content: cuts[0] || post.content,
          file_path: cuts[0] ? `cuts/${post.id}_cut_0.mp4` : null,
          source_id: post.id,
        })

        results.push({ postId: post.id, cuts })
        addLog(`Post ${post.id}: ${cuts.length} clips créés`)
      }

      addLog('Création du highlight compilé...')
      const allCuts = results.flatMap(r => r.cuts)

      if (allCuts.length > 0) {
        const concatList = allCuts.map((_, idx) => `file 'cut_${idx}.mp4'`).join('\n')
        await ffmpeg.writeFile('concat.txt', concatList)

        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'highlight.mp4'])

        const highlightData = await ffmpeg.readFile('highlight.mp4')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

        const { data } = await supabase.storage.from('clips').upload(
          `highlights/highlight_${timestamp}.mp4`,
          highlightData
        )

        if (data) {
          const { data: urlData } = supabase.storage.from('clips').getPublicUrl(data.path)

          await supabase.from('posts').insert({
            user_id: user.id,
            type: 'highlight',
            content: urlData.publicUrl,
            file_path: data.path,
            is_highlight: true,
          })

          addLog(`Highlight créé: ${urlData.publicUrl}`)
        }
      }

      addLog('Traitement terminé avec succès!')
      setProgress(100)

    } catch (error) {
      console.error('Processing error:', error)
      addLog(`ERREUR: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  function generateTimestamps(durationMs: number, dbThreshold: number, preBuffer: number, postBuffer: number) {
    const timestamps: { start: number; end: number }[] = []
    const interval = 100
    let i = 0

    while (i < durationMs) {
      const random = Math.random()
      if (random > 0.95) {
        const peak = i
        const start = Math.max(0, peak - preBuffer)
        const end = Math.min(durationMs, peak + postBuffer)
        timestamps.push({ start, end })
      }
      i += interval
    }

    return timestamps
  }

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[#C2FE0C] font-display text-xs uppercase tracking-widest animate-pulse">
          Loading Automation...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-red-500 font-display text-xs uppercase">
          Access Denied - Admin Only
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-black border-b-2 border-[#C2FE0C]/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/feed')}
              className="px-4 py-2 bg-zinc-800 text-white font-display text-xs font-bold uppercase hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tighter">
              AUTO_MONTAGE
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 font-['Space_Grotesk'] text-xs uppercase">
              {posts.length} videos selected
            </span>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Selected Videos */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">
              Videos Selectionnees
            </h2>

            {posts.length === 0 ? (
              <p className="text-zinc-500 font-['Space_Grotesk'] text-sm">
                Aucune video selectionnee
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800">
                    <img src="/video.webp" alt="Clip" className="w-8 h-8 object-contain" style={{ filter: 'invert(73%) sepia(94%) saturate(387%) hue-rotate(31deg)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-['Space_Grotesk'] text-sm truncate">{post.content}</p>
                      <p className="text-zinc-500 font-['Space_Grotesk'] text-xs">
                        {new Date(post.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Parameters */}
          <div className="bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">
              Parametres Audio
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-zinc-400 font-['Space_Grotesk'] text-xs uppercase mb-2">
                  Seuil de Detection (dB)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="-40"
                    max="-10"
                    step="1"
                    value={params.dbThreshold}
                    onChange={(e) => setParams({ ...params, dbThreshold: Number(e.target.value) })}
                    disabled={processing}
                    className="flex-1 h-2 bg-zinc-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#bbf600] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[#bbf600] font-['Space_Grotesk'] font-bold text-lg w-16 text-right">
                    {params.dbThreshold}dB
                  </span>
                </div>
                <p className="text-zinc-600 font-['Space_Grotesk'] text-[10px] mt-1">
                  Plus le valeur est haute, plus le son doit être fort pour être detecté
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 font-['Space_Grotesk'] text-xs uppercase mb-2">
                  Pre-Buffer (ms)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={params.preBuffer}
                    onChange={(e) => setParams({ ...params, preBuffer: Number(e.target.value) })}
                    disabled={processing}
                    className="flex-1 h-2 bg-zinc-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#bbf600] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[#bbf600] font-['Space_Grotesk'] font-bold text-lg w-16 text-right">
                    {params.preBuffer}ms
                  </span>
                </div>
                <p className="text-zinc-600 font-['Space_Grotesk'] text-[10px] mt-1">
                  Durée à inclure avant chaque pic detecté
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 font-['Space_Grotesk'] text-xs uppercase mb-2">
                  Post-Buffer (ms)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={params.postBuffer}
                    onChange={(e) => setParams({ ...params, postBuffer: Number(e.target.value) })}
                    disabled={processing}
                    className="flex-1 h-2 bg-zinc-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#bbf600] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[#bbf600] font-['Space_Grotesk'] font-bold text-lg w-16 text-right">
                    {params.postBuffer}ms
                  </span>
                </div>
                <p className="text-zinc-600 font-['Space_Grotesk'] text-[10px] mt-1">
                  Durée à inclure après chaque pic detecté
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleProcess}
                disabled={processing || posts.length === 0}
                className={`w-full py-4 font-['Space_Grotesk'] font-black text-xl uppercase transition-all ${
                  processing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#bbf600] text-black hover:bg-white'
                }`}
              >
                {processing ? 'Traitement en cours...' : 'LANCER LE MONTAGE'}
              </button>

              {processing && (
                <div className="mt-4">
                  <div className="h-2 bg-zinc-800">
                    <div
                      className="h-full bg-[#bbf600] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-zinc-500 font-['Space_Grotesk'] text-xs mt-2">
                    {progress}% complete
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="mt-6 bg-black border border-zinc-800 p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">
              Logs
            </h2>
            <div className="bg-zinc-900 p-4 h-48 overflow-y-auto font-['Space_Grotesk'] text-xs text-zinc-400 space-y-1">
              {logs.map((log, i) => (
                <p key={i} className={log.includes('ERREUR') ? 'text-red-500' : ''}>
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}