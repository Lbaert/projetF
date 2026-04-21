interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="bg-[#2A2A2A] border border-[#4A4A4A] rounded-lg p-4">
      <p className="text-[#71717A] text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-[#C9A227]">
        {icon && <span className="mr-2">{icon}</span>}
        {value}
      </p>
    </div>
  )
}