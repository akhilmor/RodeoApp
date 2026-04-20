'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'

export function SeedButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSeed() {
    if (!confirm('This will DELETE all placeholder teams/tickets and import the real 2026 show data (170 ticket holders, 8 teams). Board accounts are preserved. Continue?')) return
    setState('loading')
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setMsg(`Error: ${data.error}`)
        setState('error')
      } else if (data.inserted !== undefined) {
        const errNote = data.errors?.length ? ` (${data.errors.length} failed: ${data.errors[0]})` : ''
        setMsg(`Imported ${data.inserted}/${data.total} tickets${errNote}`)
        setState('done')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMsg(JSON.stringify(data).slice(0, 120))
        setState('error')
      }
    } catch {
      setState('error')
      setMsg('Request failed')
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && (
        <p style={{ fontSize: 13, color: state === 'error' ? '#ef4444' : '#f5c518' }}>{msg}</p>
      )}
      <button
        onClick={handleSeed}
        disabled={state === 'loading'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: state === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(245,197,24,0.08)',
          border: `1px solid ${state === 'done' ? 'rgba(34,197,94,0.3)' : 'rgba(245,197,24,0.2)'}`,
          color: state === 'done' ? '#4ade80' : '#f5c518',
          cursor: state === 'loading' || state === 'done' ? 'not-allowed' : 'pointer',
          opacity: state === 'loading' ? 0.6 : 1,
        }}
      >
        <Database size={15} />
        {state === 'loading' ? 'Importing...' : state === 'done' ? 'Imported ✓' : 'Import 2026 Data'}
      </button>
    </div>
  )
}
