'use client'

import { useEffect, useState } from 'react'
import { Person } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Search, Plus, X } from 'lucide-react'

const ROLE_COLORS = {
  admin: 'danger',
  liaison: 'purple',
  captain: 'success',
  volunteer: 'warning',
  audience: 'default',
} as const

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPerson, setEditPerson] = useState<Person | null>(null)
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role_type: 'audience', position: 'Audience', team_id: '', notes: '',
  })

  useEffect(() => {
    fetchPeople()
    fetch('/api/dashboard/teams').then(r => r.json()).then(setTeams)
  }, [search, roleFilter])

  async function fetchPeople() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    const res = await fetch(`/api/dashboard/people?${params}`)
    const data = await res.json()
    setPeople(data)
    setLoading(false)
  }

  async function handleSave() {
    const payload = { ...form, team_id: form.team_id || null }
    if (editPerson) {
      await fetch(`/api/dashboard/people/${editPerson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/dashboard/people', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    }
    setShowForm(false)
    setEditPerson(null)
    fetchPeople()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this person?')) return
    await fetch(`/api/dashboard/people/${id}`, { method: 'DELETE' })
    fetchPeople()
  }

  function openEdit(p: Person) {
    setEditPerson(p)
    setForm({
      first_name: p.first_name, last_name: p.last_name, email: p.email,
      phone: p.phone || '', role_type: p.role_type, position: p.position,
      team_id: p.team_id || '', notes: p.notes || '',
    })
    setShowForm(true)
  }

  function openNew() {
    setEditPerson(null)
    setForm({ first_name: '', last_name: '', email: '', phone: '', role_type: 'audience', position: 'Audience', team_id: '', notes: '' })
    setShowForm(true)
  }

  const needsTeam = ['competitor', 'liaison'].includes(form.role_type)
  const noTeam = ['admin', 'staff', 'audience'].includes(form.role_type)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-500 mt-1">{people.length} total</p>
        </div>
        <Button onClick={openNew} size="md">
          <Plus className="w-4 h-4 mr-2" /> Add Person
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people..."
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="liaison">Liaison</option>
          <option value="competitor">Competitor</option>
          <option value="audience">Audience</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Position</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Added</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : people.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No people found</td></tr>
            ) : people.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{p.first_name} {p.last_name}</td>
                <td className="px-6 py-3 text-gray-600">{p.email}</td>
                <td className="px-6 py-3">
                  <Badge variant={ROLE_COLORS[p.role_type]}>{p.role_type}</Badge>
                </td>
                <td className="px-6 py-3 text-gray-600">{p.position}</td>
                <td className="px-6 py-3 text-gray-600">{(p as any).teams?.name || '—'}</td>
                <td className="px-6 py-3 text-gray-400">{formatDate(p.created_at)}</td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editPerson ? 'Edit Person' : 'Add Person'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                  <select value={form.role_type} onChange={e => setForm(f => ({ ...f, role_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="liaison">Liaison</option>
                    <option value="competitor">Competitor</option>
                    <option value="audience">Audience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {['Director','Finance Chair','Hospitality Chair','Logistics Chair','Show Chair','Social Chair','Public Relations Chair','Tech Chair','Marketing Chair','J&O Chair','Head Liaison','Freshman Rep','Liaison','Competitor','Audience'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(needsTeam || (!noTeam)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team {needsTeam && <span className="text-red-500">*</span>}
                  </label>
                  <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    disabled={noTeam}>
                    <option value="">No team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
