'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, X, Trash2 } from 'lucide-react'

const ROLE_COLORS: Record<string, 'danger' | 'info' | 'purple' | 'success' | 'default' | 'warning'> = {
  admin: 'danger', liaison: 'purple',
  volunteer: 'warning', captain: 'success', audience: 'default',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Board', liaison: 'Liaison',
  volunteer: 'Volunteer', captain: 'Captain', audience: 'Attendee',
}
const ALL_ROLES = ['admin', 'liaison', 'volunteer', 'captain', 'audience']

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role_type: 'audience', team_id: '' })

  useEffect(() => {
    fetchUsers()
    fetch('/api/dashboard/teams').then(r => r.json()).then(setTeams)
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/dashboard/users')
    setUsers(await res.json())
    setLoading(false)
  }

  async function updateRole(id: string, role_type: string) {
    await fetch(`/api/dashboard/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_type }),
    })
    fetchUsers()
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return
    await fetch(`/api/dashboard/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  async function handleCreate() {
    await fetch('/api/dashboard/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, team_id: form.team_id || null }),
    })
    setShowForm(false)
    setForm({ first_name: '', last_name: '', email: '', password: '', role_type: 'audience', team_id: '' })
    fetchUsers()
  }

  const needsTeam = ['captain', 'liaison'].includes(form.role_type)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} users</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3">
                  <select
                    value={u.role_type}
                    onChange={e => updateRole(u.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-3 text-gray-500">{u.teams?.name || '—'}</td>
                <td className="px-6 py-3">
                  <button onClick={() => deleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
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
              <h2 className="text-lg font-bold">Add User</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Last name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.role_type} onChange={e => setForm(f => ({ ...f, role_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              {needsTeam && (
                <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select team...</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreate} className="flex-1"
                disabled={!form.first_name || !form.last_name || !form.email || !form.password}>
                Create User
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
