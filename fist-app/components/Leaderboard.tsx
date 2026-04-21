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