'use client'

import { useState } from 'react'

type EventInfo = {
  show_name?: string; show_date?: string; show_start_time?: string
  doors_open_time?: string; venue_name?: string; venue_address?: string
  venue_map_url?: string; doors_status?: 'closed' | 'opening_soon' | 'open'
  food_available?: boolean; food_notes?: string; team_order?: string[]; attendee_notes?: string
}

export function EventInfoClient({ initialInfo, canEdit }: { initialInfo: EventInfo; canEdit: boolean }) {
  const [info, setInfo] = useState<EventInfo>(initialInfo)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [teamInput, setTeamInput] = useState((initialInfo.team_order || []).join('\n'))

  function set(key: keyof EventInfo, value: unknown) {
    if (!canEdit) return
    setInfo(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const teamOrder = teamInput.split('\n').map(s => s.trim()).filter(Boolean)
    await fetch('/api/event', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...info, team_order: teamOrder }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = (extra = '') =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      canEdit ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
    } ${extra}`

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Info</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {canEdit ? 'Attendees see this on their portal. Update live on show day.' : 'View only — contact the board to make changes.'}
          </p>
        </div>
        {canEdit && (
          <button onClick={handleSave} disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        <Section title="Show Details">
          <Field label="Show Name"><input value={info.show_name || ''} onChange={e => set('show_name', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
          <Field label="Date"><input type="date" value={info.show_date || ''} onChange={e => set('show_date', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
          <Field label="Show Start Time"><input type="time" value={info.show_start_time || ''} onChange={e => set('show_start_time', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
          <Field label="Doors Open Time"><input type="time" value={info.doors_open_time || ''} onChange={e => set('doors_open_time', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
        </Section>

        <Section title="Venue">
          <Field label="Venue Name"><input value={info.venue_name || ''} onChange={e => set('venue_name', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
          <Field label="Address"><input value={info.venue_address || ''} onChange={e => set('venue_address', e.target.value)} disabled={!canEdit} className={inputCls()} /></Field>
          <Field label="Map URL"><input value={info.venue_map_url || ''} onChange={e => set('venue_map_url', e.target.value)} disabled={!canEdit} placeholder="https://maps.google.com/..." className={inputCls()} /></Field>
        </Section>

        <Section title="Live Status">
          <Field label="Doors Status">
            <select value={info.doors_status || 'closed'} onChange={e => set('doors_status', e.target.value)} disabled={!canEdit} className={inputCls()}>
              <option value="closed">🔴 Closed</option>
              <option value="opening_soon">🟡 Opening Soon</option>
              <option value="open">🟢 Open</option>
            </select>
          </Field>
          <Field label="Food Available">
            <select value={info.food_available ? 'true' : 'false'} onChange={e => set('food_available', e.target.value === 'true')} disabled={!canEdit} className={inputCls()}>
              <option value="false">Not yet</option>
              <option value="true">Available now</option>
            </select>
          </Field>
          <Field label="Food Notes"><input value={info.food_notes || ''} onChange={e => set('food_notes', e.target.value)} disabled={!canEdit} placeholder="e.g. Snacks available at lobby" className={inputCls()} /></Field>
        </Section>

        <Section title="Team Performance Order">
          <p className="text-sm text-gray-500 mb-2">One team name per line, in performance order.</p>
          <textarea value={teamInput} onChange={e => canEdit && setTeamInput(e.target.value)}
            disabled={!canEdit} rows={10} placeholder={'Team Alpha\nTeam Beta\nTeam Gamma'}
            className={inputCls()} />
        </Section>

        <Section title="General Notes for Attendees">
          <textarea value={info.attendee_notes || ''} onChange={e => set('attendee_notes', e.target.value)}
            disabled={!canEdit} rows={4} placeholder="Any extra info attendees should know..."
            className={inputCls()} />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
