import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = await createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data: person } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, role_type, team_id, teams(name)')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!person) return NextResponse.json({ found: false })

  // Dancers (competitors) don't have tickets — redirect them to event info
  if (person.role_type === 'competitor') {
    return NextResponse.json({ found: true, person, role: 'competitor', tickets: [] })
  }

  // Staff/board/liaison/volunteer should use /login instead
  if (['admin', 'staff', 'liaison', 'volunteer'].includes(person.role_type)) {
    return NextResponse.json({ found: true, role: 'staff', person, tickets: [] })
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, type, status, qr_token, scanned_at, assigned_at')
    .eq('person_id', person.id)
    .order('assigned_at', { ascending: true })

  const ticketsWithQR = await Promise.all(
    (tickets || []).map(async (ticket) => {
      const qrDataUrl = ticket.qr_token
        ? await QRCode.toDataURL(`${appUrl}/scan/${ticket.qr_token}`, { width: 300, margin: 2 })
        : null
      return { ...ticket, qrDataUrl }
    })
  )

  return NextResponse.json({ found: true, role: 'audience', person, tickets: ticketsWithQR })
}
