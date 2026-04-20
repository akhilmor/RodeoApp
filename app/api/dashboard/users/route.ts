import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, role_type, position, team_id, created_at, teams(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { first_name, last_name, email, password, role_type, team_id } = body

  const supabase = await createServiceClient()

  const ROLE_POSITION: Record<string, string> = {
    admin: 'Director', liaison: 'Liaison',
    volunteer: 'Volunteer', captain: 'Captain', audience: 'Audience',
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password: password || Math.random().toString(36).slice(-10),
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { data, error } = await supabase.from('people').insert({
    first_name, last_name, email: email.toLowerCase().trim(),
    role_type, position: ROLE_POSITION[role_type] || 'Audience',
    team_id: ['captain', 'liaison'].includes(role_type) ? (team_id || null) : null,
  }).select().single()

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
