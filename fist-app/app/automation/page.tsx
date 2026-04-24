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

function findPeaksInWav(buffer: ArrayBuffer, dbThreshold: number, preBuffer: number, postBuffer: number): { start: number; end: number }[] {
  const view = new DataView(buffer)
  const timestamps: { start: number; end: number }[] = []

  let offset = 12
  if (view.getUint32(0, true) !== 0x46464952) return timestamps

  const channels = view.getUint16(22, true)
  const sampleRate = view.getUint32(24, true)
  const bitsPerSample = view.getUint16(34, true)

  offset = 36
  while (offset < view.byteLength - 8) {
    const chunkId = view.getUint32(offset, true)
    const chunkSize = view.getUint32(offset + 4, true)
    if (chunkId === 0x61746164) break
    offset += 8 + chunkSize
  }

  if (offset >= view.byteLength) return timestamps

  const dataOffset = offset + 8
  const dataSize = Math.min(view.byteLength - dataOffset, 10 * 1024 * 1024)
  const samplesPerChannel = Math.floor(dataSize / (bitsPerSample / 8) / channels)

  const minPeakDistance = Math.floor(sampleRate * 0.5)
  let lastPeakIndex = -minPeakDistance

  for (let i = 0; i < samplesPerChannel; i++) {
    let maxSample = 0
    for (let c = 0; c < channels; c++) {
      const sampleOffset = dataOffset + i * (bitsPerSample / 8) * channels + c * (bitsPerSample / 8)
      let sample = 0
      if (bitsPerSample === 16) {
        sample = Math.abs(view.getInt16(sampleOffset, true)) / 32768
      } else if (bitsPerSample === 32) {
        sample = Math.abs(view.getFloat32(sampleOffset, true))
      }
      maxSample = Math.max(maxSample, sample)
    }

    const dbValue = 20 * Math.log10(maxSample + 0.0001)
    if (dbValue > dbThreshold && i - lastPeakIndex >= minPeakDistance / channels) {
      const peakTimeMs = (i / sampleRate) * 1000
      timestamps.push({
        start: Math.max(0, peakTimeMs - preBuffer),
        end: peakTimeMs + postBuffer
      })
      lastPeakIndex = i
    }
  }

  return timestamps
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
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<{ postId: string; cuts: string[]; cutsStoragePaths: string[] }[]>([])

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
        const videoPosts = data.filter((p: Post) => p.type === 'clip' && p.file_path)
        setPosts(videoPosts)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [user, isAdmin, searchParams, router])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleKeepClip = async (cutUrl: string, cutStoragePath: string, sourcePostId: string) => {
    const supabase = createClient()
    await supabase.from('posts').insert({
      user_id: user.id,
      type: 'clip',
      content: cutUrl,
      file_path: cutStoragePath,
      source_id: sourcePostId,
    })
    addLog(`Clip garde: ${cutUrl}`)
    setResults(prev => prev.map(r => {
      const idx = r.cuts.indexOf(cutUrl)
      if (idx === -1) return r
      const newCuts = [...r.cuts]
      const newPaths = [...r.cutsStoragePaths]
      newCuts.splice(idx, 1)
      newPaths.splice(idx, 1)
      return { ...r, cuts: newCuts, cutsStoragePaths: newPaths }
    }))
  }

  const handleDeleteClip = async (cutUrl: string, cutStoragePath: string) => {
    const supabase = createClient()
    await supabase.storage.from('clips').remove([cutStoragePath])
    addLog(`Clip supprime: ${cutStoragePath}`)
    setResults(prev => prev.map(r => {
      const idx = r.cuts.indexOf(cutUrl)
      if (idx === -1) return r
      const newCuts = [...r.cuts]
      const newPaths = [...r.cutsStoragePaths]
      newCuts.splice(idx, 1)
      newPaths.splice(idx, 1)
      return { ...r, cuts: newCuts, cutsStoragePaths: newPaths }
    }))
  }

  const handleCreateHighlight = async () => {
    setProcessing(true)
    addLog('Création du highlight...')

    try {
      const supabase = createClient()
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        addLog(`FFmpeg: ${message}`)
      })

      const baseURL = '/'
      await ffmpeg.load({
        coreURL: `${baseURL}ffmpeg-core.js`,
        wasmURL: `${baseURL}ffmpeg-core.wasm`,
      })

      const allCutStoragePaths = results.flatMap(r => r.cutsStoragePaths as string[])

      if (allCutStoragePaths.length === 0) {
        addLog('Aucun clip a assembler')
        setProcessing(false)
        return
      }

      addLog(`Téléchargement de ${allCutStoragePaths.length} clips...`)
      for (let idx = 0; idx < allCutStoragePaths.length; idx++) {
        const storagePath = allCutStoragePaths[idx]
        const { data: cutData, error: cutError } = await supabase.storage.from('clips').download(storagePath)
        if (cutError) {
          addLog(`Erreur: ${cutError.message}`)
          continue
        }
        const cutBuffer = new Uint8Array(await cutData.arrayBuffer())
        await ffmpeg.writeFile(`cut_${idx}.mp4`, cutBuffer)
        addLog(`Clip ${idx + 1} pret`)
      }

      addLog('Assemblage...')
      const concatList = allCutStoragePaths.map((_, idx) => `file 'cut_${idx}.mp4'`).join('\n')
      await ffmpeg.writeFile('concat.txt', concatList)
      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'highlight.mp4'])

      const highlightData = await ffmpeg.readFile('highlight.mp4')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      const { data } = await supabase.storage.from('clips').upload(
        `highlights/highlight_${timestamp}.mp4`,
        highlightData,
        { upsert: true }
      )

      if (data) {
        const { data: urlData } = supabase.storage.from('clips').getPublicUrl(data.path)
        const { error: insertError } = await supabase.from('posts').insert({
          user_id: user.id,
          type: 'highlight',
          content: urlData.publicUrl,
          file_path: data.path,
        })
        if (insertError) {
          addLog(`Erreur insert: ${insertError.message}`)
        } else {
          addLog(`Highlight cree: ${urlData.publicUrl}`)
        }
      }
    } catch (error) {
      addLog(`Erreur highlight: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleProcess = async () => {
    if (posts.length === 0) return
    setProcessing(true)
    setProgress(0)
    setLogs([])

    try {
      addLog('Initialisation de FFmpeg...')

      const { FFmpeg } = await import('@ffmpeg/ffmpeg')

      const ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        addLog(`FFmpeg: ${message}`)
      })

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      const baseURL = '/'
      await ffmpeg.load({
        coreURL: `${baseURL}ffmpeg-core.js`,
        wasmURL: `${baseURL}ffmpeg-core.wasm`,
      })

      addLog('FFmpeg chargé avec succès')

      const supabase = createClient()
      const newResults: { postId: string; cuts: string[]; cutsStoragePaths: string[] }[] = []

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

        addLog(`Analyse audio pour détection des pics...`)
        const audioWavName = `audio_${i}.wav`
        await ffmpeg.exec([
          '-i', inputName,
          '-vn',
          '-acodec', 'pcm_s16le',
          '-ar', '44100',
          '-ac', '2',
          audioWavName
        ])

        const audioData = await ffmpeg.readFile(audioWavName)
        const timestamps = findPeaksInWav((audioData as Uint8Array).buffer, params.dbThreshold, params.preBuffer, params.postBuffer)

        await ffmpeg.deleteFile(audioWavName)

        if (timestamps.length === 0) {
          addLog(`Aucun pic audio détecté, passage à la vidéo suivante`)
          await ffmpeg.deleteFile(inputName)
          continue
        }

        addLog(`Découpage de ${timestamps.length} segments...`)
        const cuts: string[] = []
        const cutsStoragePaths: string[] = []

        for (let j = 0; j < timestamps.length; j++) {
          const { start, end } = timestamps[j]
          const outputName = `cut_${i}_${j}.mp4`
          const storagePath = `cuts/${post.id}_cut_${j}.mp4`

          await ffmpeg.exec([
            '-i', inputName,
            '-ss', String(start / 1000),
            '-to', String(end / 1000),
            '-c', 'copy',
            outputName
          ])

          const fileData = await ffmpeg.readFile(outputName)
          addLog(`Uploading cut ${j} to ${storagePath}...`)
          const { data, error } = await supabase.storage.from('clips').upload(
            storagePath,
            fileData,
            { upsert: true }
          )

          if (error) {
            addLog(`Upload error: ${error.message}`)
            continue
          }

          if (data) {
            const { data: urlData } = supabase.storage.from('clips').getPublicUrl(data.path)
            cuts.push(urlData.publicUrl)
            cutsStoragePaths.push(storagePath)
            addLog(`Upload successful: ${urlData.publicUrl}`)
          }

          await ffmpeg.deleteFile(outputName)
        }

        await ffmpeg.deleteFile(inputName)

        newResults.push({ postId: post.id, cuts, cutsStoragePaths })
        addLog(`Post ${post.id}: ${cuts.length} clips crees (en attente de validation)`)
      }

      setResults(newResults)
      setShowResult(true)
      setProgress(100)
      addLog('Traitement termine! Previsualisez les clips et cliquez sur Garder ou Supprimer.')

    } catch (error) {
      console.error('Processing error:', error)
      addLog(`ERREUR: ${error}`)
    } finally {
      setProcessing(false)
    }
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

        {/* Result */}
        {showResult && !processing && (
          <div className="mt-6 bg-black border-2 border-[#C2FE0C] p-6">
            <h2 className="font-display text-lg font-bold text-[#C2FE0C] uppercase mb-4">
              Resultat du Montage
            </h2>
            <div className="space-y-6">
              {results.filter(r => r.cuts.length > 0).map((result, i) => (
                <div key={i} className="border border-zinc-700 p-4">
                  <p className="text-zinc-400 font-['Space_Grotesk'] text-xs mb-3">
                    Post source: {result.postId}
                  </p>
                  <p className="text-[#bbf600] font-['Space_Grotesk'] font-bold mb-3">
                    {result.cuts.length} clips en attente
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {result.cuts.map((cutUrl, j) => (
                      <div key={j} className="relative">
                        <video
                          src={cutUrl}
                          controls
                          className="w-full bg-zinc-800 aspect-video"
                        />
                        <div className="absolute bottom-8 left-2 right-2 flex gap-2">
                          <button
                            onClick={() => handleKeepClip(cutUrl, result.cutsStoragePaths[j], result.postId)}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1"
                          >
                            Garder
                          </button>
                          <button
                            onClick={() => handleDeleteClip(cutUrl, result.cutsStoragePaths[j])}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1"
                          >
                            Supprimer
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1">
                          Clip {j + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">
                <button
                  onClick={handleCreateHighlight}
                  disabled={results.every(r => r.cuts.length === 0)}
                  className={`px-6 py-3 font-display font-bold text-sm uppercase transition-colors ${
                    results.every(r => r.cuts.length === 0)
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#bbf600] text-black hover:bg-white'
                  }`}
                >
                  Creer le Highlight
                </button>
                <a
                  href="/feed"
                  className="px-6 py-3 bg-zinc-800 text-white font-display font-bold text-sm uppercase hover:bg-zinc-700 transition-colors"
                >
                  Voir le Feed
                </a>
                <button
                  onClick={() => {
                    setShowResult(false)
                    setLogs([])
                    setResults([])
                    router.push('/feed')
                  }}
                  className="px-6 py-3 bg-zinc-800 text-white font-display font-bold text-sm uppercase hover:bg-zinc-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

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