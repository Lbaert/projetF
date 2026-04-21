import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#C9A227] mb-4">FIST</h1>
        <p className="text-xl text-[#8B0000] mb-8">La Fistinière - Hell Let Loose</p>
        <p className="text-[#71717A] mb-6">Collective highlight voting platform</p>
        <Link
          href="/feed"
          className="inline-block px-6 py-3 bg-[#4B5320] text-white font-bold rounded hover:bg-[#3a3f18] transition-colors"
        >
          Entrer
        </Link>
      </div>
    </div>
  )
}