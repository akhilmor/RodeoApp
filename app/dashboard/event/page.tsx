import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventInfoClient } from './client'

export default async function EventInfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  const canEdit = person?.role_type === 'admin'

  const { data: info } = await service.from('event_info').select('*').single()

  return <EventInfoClient initialInfo={info || {}} canEdit={canEdit} />
}
