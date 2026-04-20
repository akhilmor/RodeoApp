import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  if (person?.role_type !== 'admin') return null
  return service
}

export async function GET() {
  const service = await guardAdmin()
  if (!service) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data } = await service.from('schedule_context').select('*').order('key')
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const service = await guardAdmin()
  if (!service) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { data, error } = await service.from('schedule_context').upsert({
    key: body.key,
    label: body.label,
    content: body.content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const service = await guardAdmin()
  if (!service) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { key } = await req.json()
  await service.from('schedule_context').delete().eq('key', key)
  return NextResponse.json({ ok: true })
}
