'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

const METHOD_COLORS = { stripe: 'info', venmo: 'success', zelle: 'purple', team: 'default' } as const
const STATUS_COLORS = { pending: 'warning', confirmed: 'success' } as const

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [people, setPeople] = useState<any[]>([])
  const [form, setForm] = useState({
    person_id: '', amount: '', method: 'venmo', status: 'pending', external_reference: '', notes: '',
  })

  useEffect(() => { fetchPayments() }, [statusFilter, methodFilter])
  useEffect(() => {
    fetch('/api/dashboard/people').then(r => r.json()).then(setPeople)
  }, [])

  async function fetchPayments() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (methodFilter) params.set('method', methodFilter)
    const res = await fetch(`/api/dashboard/payments?${params}`)
    const data = await res.json()
    setPayments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function toggleConfirm(id: string, current: string) {
    const status = current === 'confirmed' ? 'pending' : 'confirmed'
    await fetch(`/api/dashboard/payments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    fetchPayments()
  }

  async function handleCreate() {
    const payload = {
      ...form,
      person_id: form.person_id || null,
      amount: Math.round(parseFloat(form.amount) * 100),
    }
    await fetch('/api/dashboard/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    setShowForm(false)
    fetchPayments()
  }

  async function linkPerson(id: string, person_id: string) {
    await fetch(`/api/dashboard/payments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person_id }),
    })
    fetchPayments()
  }

  const totalConfirmed = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">
            {formatCurrency(totalConfirmed)} confirmed · {formatCurrency(totalPending)} pending
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Log Payment</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All methods</option>
          <option value="stripe">Stripe</option>
          <option value="venmo">Venmo</option>
          <option value="zelle">Zelle</option>
          <option value="team">Team</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Person</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Amount</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Method</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Reference</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No payments found</td></tr>
            ) : payments.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  {p.people ? (
                    <span className="font-medium text-gray-900">{p.people.first_name} {p.people.last_name}</span>
                  ) : (
                    <div>
                      <span className="text-yellow-600 text-xs font-medium">Unmatched</span>
                      <select
                        onChange={e => e.target.value && linkPerson(p.id, e.target.value)}
                        className="block mt-1 border border-gray-300 rounded px-2 py-0.5 text-xs"
                      >
                        <option value="">Link to person...</option>
                        {people.map((person: any) => (
                          <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                <td className="px-6 py-3"><Badge variant={METHOD_COLORS[p.method as keyof typeof METHOD_COLORS]}>{p.method}</Badge></td>
                <td className="px-6 py-3"><Badge variant={STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}>{p.status}</Badge></td>
                <td className="px-6 py-3 text-gray-500 text-xs font-mono">{p.external_reference || '—'}</td>
                <td className="px-6 py-3 text-gray-400">{formatDate(p.created_at)}</td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => toggleConfirm(p.id, p.status)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                  >
                    {p.status === 'confirmed' ? 'Unconfirm' : 'Confirm'}
                  </button>
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
              <h2 className="text-lg font-bold">Log Payment</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person (optional)</label>
                <select value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Unmatched / log now</option>
                  {people.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="25.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="venmo">Venmo</option>
                    <option value="zelle">Zelle</option>
                    <option value="stripe">Stripe</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Venmo/Zelle ID)</label>
                <input value={form.external_reference} onChange={e => setForm(f => ({ ...f, external_reference: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreate} className="flex-1" disabled={!form.amount}>Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
