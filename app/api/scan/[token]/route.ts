import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, people(first_name, last_name, email)')
    .eq('qr_token', token)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 404 })
  }

  if (ticket.scanned_at) {
    return NextResponse.json({
      valid: false,
      reason: 'already_scanned',
      scanned_at: ticket.scanned_at,
      person: ticket.people,
    })
  }

  return NextResponse.json({ valid: true, ticket, person: ticket.people })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, people(first_name, last_name, email)')
    .eq('qr_token', token)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 404 })
  }

  if (ticket.scanned_at) {
    return NextResponse.json({
      valid: false,
      reason: 'already_scanned',
      scanned_at: ticket.scanned_at,
      person: ticket.people,
    })
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('tickets')
    .update({ scanned_at: now, status: 'checked_in' })
    .eq('id', ticket.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ valid: true, person: ticket.people, ticket: { ...ticket, scanned_at: now } })
}
