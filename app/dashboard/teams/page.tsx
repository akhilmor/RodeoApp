'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', ticket_allocation: '30', notes: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/teams').then(r => r.json()),
      fetch('/api/dashboard/people').then(r => r.json()),
      fetch('/api/dashboard/tickets').then(r => r.json()),
    ]).then(([t, p, tk]) => {
      setTeams(t)
      setPeople(p)
      setTickets(tk)
    })
  }, [])

  async function handleCreate() {
    await fetch('/api/dashboard/teams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ticket_allocation: parseInt(form.ticket_allocation) }),
    })
    setShowForm(false)
    fetch('/api/dashboard/teams').then(r => r.json()).then(setTeams)
  }

  function getTeamStats(teamId: string) {
    const members = people.filter((p: any) => p.team_id === teamId)
    const competitors = members.filter((p: any) => p.role_type === 'competitor')
    const liaisons = members.filter((p: any) => p.role_type === 'liaison')
    const memberIds = members.map((p: any) => p.id)
    const teamTickets = tickets.filter((t: any) => memberIds.includes(t.person_id))
    return { competitors, liaisons, teamTickets }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">{teams.length} teams</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Team</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team: any) => {
          const { competitors, liaisons, teamTickets } = getTeamStats(team.id)
          const used = teamTickets.length
          const pct = Math.round((used / team.ticket_allocation) * 100)
          return (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{team.name}</CardTitle>
                  {pct >= 100 ? <Badge variant="danger">Full</Badge>
                    : pct >= 80 ? <Badge variant="warning">Near limit</Badge>
                    : <Badge variant="success">Available</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Tickets used</span>
                    <span>{used} / {team.ticket_allocation}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Competitors</p>
                    <p className="font-bold text-gray-900 text-lg">{competitors.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Liaisons</p>
                    <p className="font-bold text-gray-900 text-lg">{liaisons.length}</p>
                  </div>
                </div>
                {liaisons.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Liaisons</p>
                    <div className="space-y-1">
                      {liaisons.map((l: any) => (
                        <div key={l.id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-medium">
                            {l.first_name[0]}
                          </div>
                          <span className="text-gray-700">{l.first_name} {l.last_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {team.notes && <p className="text-xs text-gray-400 italic">{team.notes}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Add Team</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Allocation</label>
                <input type="number" value={form.ticket_allocation} onChange={e => setForm(f => ({ ...f, ticket_allocation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreate} className="flex-1" disabled={!form.name}>Create Team</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
