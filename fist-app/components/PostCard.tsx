import { useState } from 'react'
import { VoteButtons } from './VoteButtons'
import type { Post, User } from '@/lib/types'

interface PostCardProps {
  post: Post & { user: User; user_vote?: 1 | -1 }
  canVote: boolean
  canDelete: boolean
  onDelete: (postId: string) => void
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('twitch.tv')
}

function VideoThumbnail({ url }: { url: string }) {
  const [isHovered, setIsHovered] = useState(false)

  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
    return (
      <div
        className="relative w-full aspect-video bg-black mb-4 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          src={url}
          className="w-full h-full object-cover"
          autoPlay={isHovered}
          muted={isHovered}
          loop={isHovered}
          playsInline
        />
      </div>
    )
  }

  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    return (
      <div
        className="relative w-full aspect-video bg-black mb-4 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=${isHovered ? 1 : 0}&mute=${isHovered ? 1 : 0}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return null
}

export function PostCard({ post, canVote, canDelete, onDelete }: PostCardProps) {
  const upvotes = (post as any).upvotes ?? 0
  const downvotes = (post as any).downvotes ?? 0

  const typeColors: Record<string, string> = {
    clip: 'bg-white text-black',
    music: 'bg-cyan-400 text-black',
    reference: 'bg-purple-400 text-black',
    soundboard: 'bg-orange-400 text-black',
  }

  const typeLabels: Record<string, string> = {
    clip: 'Clip',
    music: 'Musique',
    reference: 'Référence',
    soundboard: 'Soundboard',
  }

  const total = upvotes + downvotes
  const percentage = total > 0 ? Math.round((upvotes / total) * 100) : 0

  return (
    <div className="bg-black border border-zinc-800 group hover:border-[#bbf600]/50 transition-all duration-75 relative overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
            {post.user?.avatar ? (
              <img
                src={post.user.avatar}
                alt={post.user?.username}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <img
                src={`https://cdn.discordapp.com/embed/avatars/${(post.user?.username?.charCodeAt(0) || 0) % 5}.png`}
                alt={post.user?.username}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-xs text-zinc-300 uppercase truncate">{post.user?.username}</span>
          <span className={`text-[10px] font-['Space_Grotesk'] font-bold px-2 py-0.5 shrink-0 ${typeColors[post.type]}`}>
            {typeLabels[post.type]}
          </span>
          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-[10px] font-['Space_Grotesk'] text-red-500 hover:text-red-400 uppercase font-bold shrink-0"
            >
              Delete
            </button>
          )}
          {percentage >= 90 && (
            <span className="bg-[#bbf600] text-black font-['Space_Grotesk'] font-black px-2 py-0.5 text-[10px] ml-auto shrink-0">
              {percentage}%
            </span>
          )}
          {percentage > 0 && percentage < 90 && (
            <span className="bg-[#bbf600]/20 text-[#bbf600] font-['Space_Grotesk'] font-black px-2 py-0.5 text-[10px] border border-[#bbf600]/30 ml-auto shrink-0">
              {percentage}%
            </span>
          )}
        </div>

        {!(post.type === 'clip' && isVideoUrl(post.content)) && (
          <h3 className="font-['Space_Grotesk'] font-bold text-lg text-white uppercase leading-tight mb-4">
            {post.title || post.content}
          </h3>
        )}

        {post.type === 'soundboard' && post.file_path ? (
          <audio controls src={post.file_path} className="w-full mb-4" />
        ) : post.type === 'clip' && isVideoUrl(post.content) ? (
          <div className="relative w-full aspect-video bg-black mb-4 overflow-hidden -mx-4 -mt-4">
            <VideoThumbnail url={post.content} />
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black z-10">
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] font-bold text-xs text-white uppercase">{post.user?.username}</span>
                <span className={`text-[10px] font-['Space_Grotesk'] font-bold px-2 py-0.5 ${typeColors[post.type]}`}>
                  {typeLabels[post.type]}
                </span>
                {canDelete && (
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-[10px] font-['Space_Grotesk'] text-red-500 hover:text-red-400 uppercase font-bold"
                  >
                    Delete
                  </button>
                )}
              </div>
              {percentage >= 90 && (
                <span className="bg-[#bbf600] text-black font-['Space_Grotesk'] font-black px-2 py-0.5 text-[10px]">
                  {percentage}% APPROVAL
                </span>
              )}
              {percentage > 0 && percentage < 90 && (
                <span className="bg-[#bbf600]/20 text-[#bbf600] font-['Space_Grotesk'] font-black px-2 py-0.5 text-[10px] border border-[#bbf600]/30">
                  {percentage}% APPROVAL
                </span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex z-10">
              <button className="flex-1 bg-black/60 py-2 flex items-center justify-center gap-2 hover:bg-[#bbf600] hover:text-black transition-colors group/vote backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm group-hover/vote:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-['Space_Grotesk'] text-xs font-bold">{upvotes}</span>
              </button>
              <button className="flex-1 bg-black/60 py-2 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors group/vote backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm group-hover/vote:scale-125 transition-transform">thumb_down</span>
                <span className="font-['Space_Grotesk'] text-xs font-bold">{downvotes}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-4 break-all">{post.content}</p>
            <div className="grid grid-cols-2 gap-px bg-zinc-800 border border-zinc-800 mb-4">
              <button className="bg-black py-2 flex items-center justify-center gap-2 hover:bg-[#bbf600] hover:text-black transition-colors group/vote">
                <span className="material-symbols-outlined text-sm group-hover/vote:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-['Space_Grotesk'] text-xs font-bold">{upvotes}</span>
              </button>
              <button className="bg-black py-2 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors group/vote">
                <span className="material-symbols-outlined text-sm group-hover/vote:scale-125 transition-transform">thumb_down</span>
                <span className="font-['Space_Grotesk'] text-xs font-bold">{downvotes}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}