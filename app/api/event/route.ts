import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data } = await supabase.from('event_info').select('*').single()
  return NextResponse.json(data || {})
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data: existing } = await supabase.from('event_info').select('id').single()

  if (existing) {
    const { data, error } = await supabase
      .from('event_info')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    const { data, error } = await supabase.from('event_info').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}
