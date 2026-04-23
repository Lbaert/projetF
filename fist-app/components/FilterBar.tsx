'use client'

import type { ContentType } from '@/lib/types'

interface FilterBarProps {
  selected: ContentType | 'all'
  onChange: (type: ContentType | 'all') => void
}

export function FilterBar({ selected, onChange }: FilterBarProps) {
  const filters: { value: ContentType | 'all'; label: string }[] = [
    { value: 'all', label: 'ALL_TYPES' },
    { value: 'clip', label: '🎬 Clip' },
    { value: 'music', label: '🎵 Musique' },
    { value: 'reference', label: '💬 Référence' },
    { value: 'soundboard', label: '🔊 Soundboard' },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-4 py-2 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-tighter transition-all ${
            selected === filter.value
              ? 'bg-[#bbf600] text-black'
              : 'border border-zinc-800 text-zinc-500 hover:border-[#bbf600]/50 hover:text-white'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}