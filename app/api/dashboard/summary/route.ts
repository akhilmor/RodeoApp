import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()

  const [tickets, payments, teams, people] = await Promise.all([
    supabase.from('tickets').select('id, type, status, person_id'),
    supabase.from('payments').select('id, amount, status, method'),
    supabase.from('teams').select('id, name, ticket_allocation'),
    supabase.from('people').select('id, team_id, role_type'),
  ])

  const allTickets = tickets.data || []
  const allPayments = payments.data || []
  const allTeams = teams.data || []
  const allPeople = people.data || []

  const totalTickets = allTickets.length
  const paidTickets = allTickets.filter(t => t.status === 'paid' || t.status === 'picked_up').length
  const unpaidTickets = allTickets.filter(t => t.status !== 'paid' && t.status !== 'picked_up').length
  const pickedUp = allTickets.filter(t => t.status === 'picked_up').length
  const notPickedUp = allTickets.filter(t => t.status === 'paid').length

  const confirmedRevenue = allPayments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalCapacity = allTeams.reduce((sum, t) => sum + t.ticket_allocation, 0)
  const remaining = Math.max(0, totalCapacity - totalTickets)

  // Per-team breakdown
  const teamBreakdown = allTeams.map(team => {
    const teamPeople = allPeople.filter(p => p.team_id === team.id)
    const teamPersonIds = teamPeople.map(p => p.id)
    const teamTickets = allTickets.filter(t => teamPersonIds.includes(t.person_id))
    return {
      ...team,
      member_count: teamPeople.length,
      tickets_used: teamTickets.length,
      tickets_remaining: Math.max(0, team.ticket_allocation - teamTickets.length),
    }
  })

  return NextResponse.json({
    total_tickets: totalTickets,
    paid_tickets: paidTickets,
    unpaid_tickets: unpaidTickets,
    picked_up: pickedUp,
    not_picked_up: notPickedUp,
    confirmed_revenue: confirmedRevenue,
    total_capacity: totalCapacity,
    remaining_capacity: remaining,
    team_breakdown: teamBreakdown,
  })
}
