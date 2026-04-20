import { Sidebar } from '@/components/dashboard/sidebar'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = await createServiceClient()
  const { data: person } = await service
    .from('people')
    .select('role_type')
    .eq('email', user.email!)
    .single()

  const role = person?.role_type ?? 'admin'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
