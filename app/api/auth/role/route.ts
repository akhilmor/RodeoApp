import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ role: null })

  const service = await createServiceClient()
  const { data: person } = await service
    .from('people')
    .select('role_type')
    .ilike('email', user.email!)
    .single()

  return NextResponse.json({ role: person?.role_type ?? null })
}
