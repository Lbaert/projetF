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