import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

async function getEventInfo() {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase.from('event_info').select('*').single()
    return data
  } catch { return null }
}

const DOOR_STATUS = {
  closed: { label: 'Doors Closed', color: 'bg-red-900/40 text-red-300 border-red-800' },
  opening_soon: { label: 'Opening Soon', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  open: { label: 'Doors Open', color: 'bg-green-900/40 text-green-300 border-green-800' },
}

export default async function EventPage() {
  const info = await getEventInfo()

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link href="/portal" className="text-gray-500 hover:text-gray-300 text-sm">← My Tickets</Link>
          <h1 className="text-4xl font-black mt-3">{info?.show_name || 'Raas Rodeo'}</h1>
          {info?.show_date && (
            <p className="text-gray-400 mt-1">{new Date(info.show_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
        </div>

        {/* Live Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {info?.doors_status && (
            <div className={`rounded-xl border p-4 text-center ${DOOR_STATUS[info.doors_status as keyof typeof DOOR_STATUS]?.color}`}>
              <p className="text-xs uppercase tracking-wide mb-1">Doors</p>
              <p className="font-bold">{DOOR_STATUS[info.doors_status as keyof typeof DOOR_STATUS]?.label}</p>
            </div>
          )}
          <div className={`rounded-xl border p-4 text-center ${info?.food_available ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-gray-800/40 text-gray-400 border-gray-700'}`}>
            <p className="text-xs uppercase tracking-wide mb-1">Food</p>
            <p className="font-bold">{info?.food_available ? 'Available' : 'Not Yet'}</p>
          </div>
        </div>

        {info?.food_notes && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-300">
            🍽️ {info.food_notes}
          </div>
        )}

        {/* Schedule */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-lg mb-4">Show Schedule</h2>
          <div className="space-y-3">
            {info?.doors_open_time && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Doors Open</span>
                <span className="font-medium">{formatTime(info.doors_open_time)}</span>
              </div>
            )}
            {info?.show_start_time && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Show Starts</span>
                <span className="font-medium">{formatTime(info.show_start_time)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team Order */}
        {info?.team_order && info.team_order.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
            <h2 className="font-bold text-lg mb-4">Performance Order</h2>
            <ol className="space-y-2">
              {info.team_order.map((team: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</span>
                  <span>{team}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Venue */}
        {(info?.venue_name || info?.venue_address) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
            <h2 className="font-bold text-lg mb-3">Venue</h2>
            {info.venue_name && <p className="font-medium">{info.venue_name}</p>}
            {info.venue_address && <p className="text-gray-400 text-sm mt-1">{info.venue_address}</p>}
            {info.venue_map_url && (
              <a href={info.venue_map_url} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                Open in Maps →
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {info?.attendee_notes && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
            <h2 className="font-bold text-lg mb-3">Notes</h2>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{info.attendee_notes}</p>
          </div>
        )}

        {!info && (
          <div className="text-center text-gray-500 py-16">Event details coming soon.</div>
        )}
      </div>
    </div>
  )
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}
