'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

const STATUS_COLORS = {
  reserved: 'default',
  assigned: 'info',
  paid: 'success',
  checked_in: 'purple',
} as const

const TYPE_LABELS = { competitor: 'Competitor', ff: 'Friends & Family', public: 'General' }

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
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
    reserved: 'assigned', assigned: 'paid',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 mt-1">{tickets.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Assign Ticket</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All statuses</option>
          <option value="reserved">Reserved</option>
          <option value="assigned">Assigned</option>
          <option value="paid">Paid</option>
          <option value="checked_in">Checked In</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All types</option>
          <option value="competitor">Competitor</option>
          <option value="ff">Friends & Family</option>
          <option value="public">General</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Person</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Assigned</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No tickets found</td></tr>
            ) : tickets.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {t.people ? `${t.people.first_name} ${t.people.last_name}` : '—'}
                  <div className="text-gray-400 text-xs">{t.people?.email}</div>
                </td>
                <td className="px-6 py-3"><Badge>{TYPE_LABELS[t.type as keyof typeof TYPE_LABELS]}</Badge></td>
                <td className="px-6 py-3"><Badge variant={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>{t.status}</Badge></td>
                <td className="px-6 py-3 text-gray-600">{t.people?.teams?.name || '—'}</td>
                <td className="px-6 py-3 text-gray-400">{formatDate(t.assigned_at)}</td>
                <td className="px-6 py-3">
                  {nextStatus[t.status] && (
                    <button
                      onClick={() => updateStatus(t.id, nextStatus[t.status])}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium whitespace-nowrap"
                    >
                      Mark {nextStatus[t.status].replace('_', ' ')} →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Assign Ticket</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
                <select value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select person...</option>
                  {people.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="competitor">Competitor</option>
                  <option value="ff">Friends & Family</option>
                  <option value="public">General Admission</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="reserved">Reserved</option>
                  <option value="assigned">Assigned</option>
                  <option value="paid">Paid</option>
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
