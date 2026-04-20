import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  venmo_handle: z.string().optional(),
  role_type: z.enum(['admin', 'staff', 'liaison', 'competitor', 'audience']),
  position: z.string(),
  team_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const role = searchParams.get('role')
  const team = searchParams.get('team')

  let query = supabase
    .from('people')
    .select('*, teams(id, name)')
    .order('last_name')

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (role) query = query.eq('role_type', role)
  if (team) query = query.eq('team_id', team)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  try {
    const data = schema.parse(body)
    const { data: person, error } = await supabase.from('people').insert(data).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(person, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
  }
}
