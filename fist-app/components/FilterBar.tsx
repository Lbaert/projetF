'use client'

import type { ContentType } from '@/lib/types'

interface FilterBarProps {
  selected: ContentType | 'all'
  onChange: (type: ContentType | 'all') => void
}

export function FilterBar({ selected, onChange }: FilterBarProps) {
  const filters: { value: ContentType | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'clip', label: '🎬 Clips' },
    { value: 'music', label: '🎵 Musiques' },
    { value: 'reference', label: '💬 Références' },
    { value: 'soundboard', label: '🔊 Soundboard' },
  ]

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-4 py-2 rounded font-bold transition-colors ${
            selected === filter.value
              ? 'bg-[#C9A227] text-black'
              : 'bg-[#4A4A4A] hover:bg-[#5A5A5A]'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}