import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DancerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()
  const { data: person } = await service
    .from('people')
    .select('*, teams(name)')
    .eq('email', user.email!)
    .single()

  if (!person || person.role_type !== 'captain') redirect('/login')

  const { data: eventInfo } = await service.from('event_info').select('*').single()

  async function signOut() {
    'use server'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-indigo-400 text-sm font-semibold">Dancer Portal</p>
            <h1 className="text-2xl font-black mt-1">Hi, {person.first_name}! 🎭</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-gray-500 hover:text-gray-300 text-sm">Sign Out</button>
          </form>
        </div>

        {/* Team Card */}
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-2xl p-6 mb-4">
          <p className="text-indigo-400 text-xs uppercase tracking-wide mb-1">Your Team</p>
          <p className="text-white font-bold text-xl">{person.teams?.name || 'Unassigned'}</p>
          <p className="text-indigo-300 text-sm mt-1">{person.position}</p>
        </div>

        {/* No ticket needed */}
        <div className="bg-green-900/20 border border-green-800 rounded-2xl p-5 mb-4 text-center">
          <p className="text-green-400 font-semibold">✓ You&apos;re on the list</p>
          <p className="text-green-300/70 text-sm mt-1">Competing dancers don&apos;t need a ticket. Just show up!</p>
        </div>

        {/* Event Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="font-bold mb-4">Event Details</h2>
          <div className="space-y-3 text-sm">
            {eventInfo?.show_date && <Row label="Date" value={new Date(eventInfo.show_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} />}
            {eventInfo?.show_start_time && <Row label="Show Start" value={formatTime(eventInfo.show_start_time)} />}
            {eventInfo?.doors_open_time && <Row label="Doors Open" value={formatTime(eventInfo.doors_open_time)} />}
            {eventInfo?.venue_name && <Row label="Venue" value={eventInfo.venue_name} />}
            {eventInfo?.venue_address && <Row label="Address" value={eventInfo.venue_address} />}
            {eventInfo?.venue_map_url && (
              <a href={eventInfo.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm">Open in Maps →</a>
            )}
          </div>
        </div>

        {/* Performance Order */}
        {eventInfo?.team_order?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold mb-4">Performance Order</h2>
            <ol className="space-y-2">
              {eventInfo.team_order.map((team: string, i: number) => (
                <li key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${team === person.teams?.name ? 'bg-indigo-900/40 border border-indigo-700' : ''}`}>
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span className={team === person.teams?.name ? 'text-indigo-300 font-semibold' : ''}>{team}</span>
                  {team === person.teams?.name && <span className="text-xs text-indigo-400 ml-auto">← You</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 text-right">{value}</span>
    </div>
  )
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
