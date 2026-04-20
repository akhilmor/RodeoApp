import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

async function getEventInfo() {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase.from('event_info').select('*').single()
    return data
  } catch { return null }
}

async function getTeamCount() {
  try {
    const supabase = await createServiceClient()
    const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch { return 0 }
}

export default async function HomePage() {
  const [info, teamCount] = await Promise.all([getEventInfo(), getTeamCount()])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/20 pointer-events-none" />
        <div className="relative max-w-lg w-full">
          <p className="text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-4">Collegiate Raas Competition</p>
          <h1 className="text-6xl font-black tracking-tight mb-6">{info?.show_name || 'Raas Rodeo'}</h1>

          <div className="grid grid-cols-3 gap-4 my-10">
            <Stat label="Date" value={info?.show_date ? new Date(info.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'} />
            <Stat label="Venue" value={info?.venue_name || 'TBA'} />
            <Stat label="Teams" value={teamCount > 0 ? `${teamCount}` : 'TBA'} />
          </div>

          <Link
            href="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-12 py-4 rounded-full text-lg transition-colors"
          >
            Login / Sign Up
          </Link>
        </div>
      </div>

      <footer className="text-center py-4 text-gray-700 text-xs">
        © {new Date().getFullYear()} Raas Rodeo
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white font-bold text-sm">{value}</p>
    </div>
  )
}
