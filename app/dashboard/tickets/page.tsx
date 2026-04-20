'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, X } from 'lucide-react'

const STATUS_COLORS = {
  reserved: 'default',
  assigned: 'info',
  paid: 'success',
  picked_up: 'purple',
  checked_in: 'purple',
} as const

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reserved', assigned: 'Assigned',
  paid: 'Paid', picked_up: 'Picked Up', checked_in: 'Checked In',
}

const TYPE_LABELS: Record<string, string> = {
  competitor: 'Competitor', ff: 'Friends & Family',
  public: 'General', general: 'General',
}

const TYPE_COLORS: Record<string, string> = {
  competitor: 'info', ff: 'warning', public: 'default', general: 'default',
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [people, setPeople] = useState<any[]>([])
  const [form, setForm] = useState({ person_id: '', type: 'public', status: 'reserved' })

  useEffect(() => { fetchTickets() }, [statusFilter, typeFilter])
  useEffect(() => {
    fetch('/api/dashboard/people').then(r => r.json()).then(setPeople)
  }, [])

  async function fetchTickets() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/dashboard/tickets?${params}`)
    const data = await res.json()
    setTickets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/dashboard/tickets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    fetchTickets()
  }

  async function handleCreate() {
    await fetch('/api/dashboard/tickets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setShowForm(false)
    fetchTickets()
  }

  const nextStatus: Record<string, string> = {
    reserved: 'paid',
  }

  const q = search.toLowerCase()
  const filtered = tickets.filter(t => {
    if (!q) return true
    const name = t.people ? `${t.people.first_name} ${t.people.last_name}`.toLowerCase() : ''
    const team = t.people?.teams?.name?.toLowerCase() || ''
    const email = t.people?.email?.toLowerCase() || ''
    return name.includes(q) || team.includes(q) || email.includes(q)
  })

  // Summary counts
  const paid = tickets.filter(t => t.status === 'paid' || t.status === 'picked_up').length
  const pickedUp = tickets.filter(t => t.status === 'picked_up').length
  const unpaid = tickets.filter(t => t.status === 'reserved' || t.status === 'assigned').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 mt-1">
            {tickets.length} total &nbsp;·&nbsp; {paid} paid &nbsp;·&nbsp; {pickedUp} picked up &nbsp;·&nbsp; {unpaid} unpaid
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Add Ticket</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4b5563' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, team, email…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 10,
              color: '#e2e8f0', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="reserved">Reserved</option>
          <option value="paid">Paid</option>
          <option value="picked_up">Picked Up</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="ff">Friends & Family</option>
          <option value="public">General / Public</option>
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a3a' }}>
        <table className="w-full text-sm">
          <thead style={{ background: '#111118', borderBottom: '1px solid #1e1e2a' }}>
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">School</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No tickets found</td></tr>
            ) : filtered.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1e1e2a' }} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">
                    {t.people ? `${t.people.first_name} ${t.people.last_name}` : '—'}
                  </p>
                  {t.people?.email && <p className="text-xs text-gray-400">{t.people.email}</p>}
                </td>
                <td className="px-6 py-3 text-gray-500">
                  {t.people?.teams?.name || <span style={{ color: '#374151' }}>Public</span>}
                </td>
                <td className="px-6 py-3">
                  <Badge variant={TYPE_COLORS[t.type] as any}>
                    {TYPE_LABELS[t.type] || t.type}
                  </Badge>
                </td>
                <td className="px-6 py-3">
                  <Badge variant={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || 'default'}>
                    {STATUS_LABELS[t.status] || t.status}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-xs max-w-48 truncate" style={{ color: t.type === 'ff' ? '#e2e8f0' : '#4b5563' }}>
                  {t.type === 'ff' ? (t.notes || '—') : 'N/A'}
                </td>
                <td className="px-6 py-3">
                  {nextStatus[t.status] && (
                    <button onClick={() => updateStatus(t.id, nextStatus[t.status])}
                      style={{ color: '#f5c518', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Mark {STATUS_LABELS[nextStatus[t.status]]} →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Add Ticket</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Person</label>
                <select value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select person…</option>
                  {people.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.email ? ` (${p.email})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="ff">Friends & Family</option>
                  <option value="public">General / Public</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="reserved">Reserved</option>
                  <option value="paid">Paid</option>
                  <option value="picked_up">Picked Up</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreate} className="flex-1" disabled={!form.person_id}>Create</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
