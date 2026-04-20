'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'

export function SeedButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSeed() {
    if (!confirm('Import all 170 ticket records from the 2026 show? This will add people and tickets to the database.')) return
    setState('loading')
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' })
      const data = await res.json()
      if (data.skipped) {
        setMsg(data.message)
        setState('done')
      } else if (data.inserted !== undefined) {
        setMsg(`Imported ${data.inserted} tickets · ${data.teams_created} teams created`)
        setState('done')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMsg(data.error || 'Error')
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
        disabled={state === 'loading' || state === 'done'}
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
