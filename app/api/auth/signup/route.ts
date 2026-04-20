import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ROLE_POSITION: Record<string, string> = {
  admin: 'Director',
  liaison: 'Liaison',
  volunteer: 'Volunteer',
  captain: 'Captain',
  audience: 'Audience',
}

export async function POST(req: NextRequest) {
  const { first_name, last_name, email, password, role_type, team_id } = await req.json()

  if (!first_name || !last_name || !email || !password || !role_type) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Create people record
  const { error: personError } = await supabase.from('people').insert({
    first_name,
    last_name,
    email: email.toLowerCase().trim(),
    role_type,
    position: ROLE_POSITION[role_type] || 'Audience',
    team_id: ['captain', 'liaison'].includes(role_type) ? (team_id || null) : null,
  })

  if (personError) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: personError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
