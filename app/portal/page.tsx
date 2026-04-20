import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'

const TYPE_LABELS: Record<string, string> = {
  competitor: 'Competitor', ff: 'Friends & Family', public: 'General Admission',
}
const STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-gray-700 text-gray-300', assigned: 'bg-blue-900 text-blue-300',
  paid: 'bg-green-900 text-green-300', checked_in: 'bg-purple-900 text-purple-300',
}

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()
  const { data: person } = await service
    .from('people')
    .select('*, teams(name)')
    .ilike('email', user.email!)
    .single()

  if (!person) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Account not linked</p>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Your login exists but no attendee record was found. Contact the organizers to get your account set up.</p>
          <form action="/auth/signout" method="post">
            <button style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#e2e8f0', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>Sign Out</button>
          </form>
        </div>
      </div>
    )
  }

  // Route non-attendees to correct place
  if (person.role_type === 'captain') redirect('/dancer')
  if (person.role_type === 'admin') redirect('/dashboard')
  if (['liaison', 'volunteer'].includes(person.role_type)) redirect('/dashboard/logistics')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { data: tickets } = await service
    .from('tickets')
    .select('id, type, status, qr_token, scanned_at, assigned_at')
    .eq('person_id', person.id)
    .order('assigned_at', { ascending: true })

  const ticketsWithQR = await Promise.all(
    (tickets || []).map(async (ticket) => {
      const qrDataUrl = ticket.qr_token && !ticket.scanned_at
        ? await QRCode.toDataURL(`${appUrl}/scan/${ticket.qr_token}`, { width: 300, margin: 2 })
        : null
      return { ...ticket, qrDataUrl }
    })
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-indigo-400 text-sm font-semibold">Attendee Portal</p>
            <h1 className="text-2xl font-black mt-1">Hi, {person.first_name}!</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-gray-500 hover:text-gray-300 text-sm">Sign Out</button>
          </form>
        </div>

        {ticketsWithQR.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No tickets found for your account.</p>
            <Link href="/tickets" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              Buy Tickets →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {ticketsWithQR.map((ticket, i) => (
              <div key={ticket.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">Ticket {i + 1} — {TYPE_LABELS[ticket.type] || ticket.type}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {ticket.scanned_at ? `Checked in ${new Date(ticket.scanned_at).toLocaleString()}` : 'Not yet scanned'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-700 text-gray-300'}`}>
                    {ticket.status === 'checked_in' ? 'Checked In' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
                {ticket.qrDataUrl ? (
                  <div className="flex flex-col items-center">
                    <Image src={ticket.qrDataUrl} alt="QR Code" width={220} height={220} className="rounded-xl" />
                    <p className="text-gray-500 text-xs mt-3">Show this at the door · One-time use only</p>
                  </div>
                ) : ticket.scanned_at ? (
                  <div className="text-center py-6 text-purple-400">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-semibold">Checked in</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(ticket.scanned_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">QR code not available yet</div>
                )}
              </div>
            ))}
          </div>
        )}

        <Link href="/event" className="block mt-8 text-center text-indigo-400 hover:text-indigo-300 text-sm">
          View event info, team order & venue →
        </Link>
      </div>
    </div>
  )
}
