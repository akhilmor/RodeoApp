import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const team = searchParams.get('team')

  let query = supabase
    .from('tasks')
    .select('*, people(id, first_name, last_name), teams(id, name)')
    .order('start_time', { ascending: true })

  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (team) query = query.eq('team_id', team)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase.from('tasks').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
