import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const method = searchParams.get('method')

  let query = supabase
    .from('payments')
    .select('*, people(id, first_name, last_name, email)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (method) query = query.eq('method', method)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase.from('payments').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
