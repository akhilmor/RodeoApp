import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SeedButton } from './seed-button'
import { formatCurrency } from '@/lib/utils'
import { Ticket, DollarSign, Users, AlertCircle, CheckCircle, Package } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'

async function getSummary() {
  const supabase = await createServiceClient()

  const [tickets, teams, people] = await Promise.all([
    supabase.from('tickets').select('id, type, status, person_id'),
    supabase.from('teams').select('id, name, ticket_allocation'),
    supabase.from('people').select('id, team_id, role_type'),
  ])

  const allTickets = tickets.data || []
  const allTeams = teams.data || []
  const allPeople = people.data || []

  const TICKET_PRICE_CENTS = 3500
  const paidTickets = allTickets.filter(t => t.status === 'paid' || t.status === 'picked_up').length
  const unpaidTickets = allTickets.filter(t => t.status !== 'paid' && t.status !== 'picked_up').length
  const notPickedUp = allTickets.filter(t => t.status === 'paid').length
  const revenue = paidTickets * TICKET_PRICE_CENTS
  const totalCapacity = allTeams.reduce((s, t) => s + t.ticket_allocation, 0)

  const teamBreakdown = allTeams.map(team => {
    const teamPersonIds = allPeople.filter(p => p.team_id === team.id).map(p => p.id)
    const used = allTickets.filter(t => teamPersonIds.includes(t.person_id)).length
    return { ...team, used, remaining: Math.max(0, team.ticket_allocation - used) }
  })

  return {
    total: allTickets.length,
    paid: paidTickets,
    unpaid: unpaidTickets,
    notPickedUp,
    revenue,
    remaining: Math.max(0, totalCapacity - allTickets.length),
    teamBreakdown,
  }
}

export default async function DashboardPage() {
  const summary = await getSummary()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Raas Rodeo 2026 — A Night in Gotham</p>
        </div>
        <SeedButton />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Tickets" value={summary.total} icon={Ticket} color="indigo" />
        <StatCard label="Paid" value={summary.paid} icon={CheckCircle} color="green" />
        <StatCard label="Unpaid" value={summary.unpaid} icon={AlertCircle} color="yellow" />
        <StatCard label="Not Picked Up" value={summary.notPickedUp} icon={Package} color="purple" />
        <StatCard label="Revenue" value={formatCurrency(summary.revenue)} icon={DollarSign} color="green" />
        <StatCard label="Remaining" value={summary.remaining} icon={Users} color="indigo" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-Team Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Allocation</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Used</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Remaining</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.teamBreakdown.map(team => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{team.name}</td>
                  <td className="px-6 py-3 text-gray-600">{team.ticket_allocation}</td>
                  <td className="px-6 py-3 text-gray-600">{team.used}</td>
                  <td className="px-6 py-3 text-gray-600">{team.remaining}</td>
                  <td className="px-6 py-3">
                    {team.remaining === 0 ? (
                      <Badge variant="danger">Full</Badge>
                    ) : team.remaining <= 5 ? (
                      <Badge variant="warning">Low</Badge>
                    ) : (
                      <Badge variant="success">Available</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
