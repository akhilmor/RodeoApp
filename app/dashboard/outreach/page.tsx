'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search, Send, Loader2, CheckCircle, AlertCircle,
  RefreshCw, Trash2, Mail, Globe, Phone, MapPin, ChevronDown, ChevronUp
} from 'lucide-react'

type Prospect = {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  location: string | null
  category: string | null
  status: 'new' | 'contacted' | 'responded' | 'donated' | 'declined'
  last_contacted_at: string | null
  notes: string | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  new:       { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  contacted: { bg: 'rgba(245,197,24,0.12)',  color: '#f5c518' },
  responded: { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  donated:   { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
  declined:  { bg: 'rgba(239,68,68,0.1)',    color: '#f87171' },
}

const PRESETS = [
  { value: 'indian_businesses', label: 'Indian Businesses', desc: 'Restaurants, groceries, shops' },
  { value: 'community_orgs',    label: 'Community Orgs',    desc: 'Temples, cultural associations' },
  { value: 'donors',            label: 'Indian Professionals', desc: 'Doctors, lawyers, business owners' },
  { value: 'local_sponsors',    label: 'Austin Sponsors',   desc: 'Companies with giving programs' },
]

const Card = ({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`rounded-2xl ${className}`} style={{
    background: 'var(--bat-card)',
    border: '1px solid var(--bat-border)',
    ...style
  }}>{children}</div>
)

export default function OutreachPage() {
  const [prospects, setProspects]     = useState<Prospect[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [discovering, setDiscovering]       = useState(false)
  const [discoverResult, setDiscoverResult] = useState<{ added: number; with_email: number } | null>(null)
  const [discoverError, setDiscoverError]   = useState('')
  const [selectedPreset, setSelectedPreset] = useState('indian_businesses')
  const [customQuery, setCustomQuery]       = useState('')
  const [showDiscover, setShowDiscover]     = useState(true)

  const [sending, setSending]           = useState(false)
  const [sendResult, setSendResult]     = useState<{ sent: number; failed: number } | null>(null)
  const [sendError, setSendError]       = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showSendPanel, setShowSendPanel] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    const res = await fetch(`/api/outreach/prospects?${params}`)
    const data = await res.json()
    setProspects(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter, categoryFilter])

  useEffect(() => { load() }, [load])

  async function handleDiscover() {
    setDiscovering(true)
    setDiscoverResult(null)
    setDiscoverError('')
    const res = await fetch('/api/outreach/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: selectedPreset, custom_query: customQuery || undefined }),
    })
    const data = await res.json()
    setDiscovering(false)
    if (res.ok) { setDiscoverResult(data); load() }
    else setDiscoverError(data.error || 'Discovery failed')
  }

  async function handleSend(sendAll = false) {
    if (!sendAll && selected.size === 0) return
    const count = sendAll ? prospects.filter(p => p.email).length : selected.size
    if (!confirm(`Send fundraising emails to ${count} recipients?`)) return
    setSending(true)
    setSendResult(null)
    setSendError('')
    const res = await fetch('/api/outreach/prospects/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_ids: sendAll ? undefined : Array.from(selected),
        send_to_all_with_email: sendAll,
        custom_message: customMessage || undefined,
      }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) { setSendResult(data); setSelected(new Set()); load() }
    else setSendError(data.error || 'Send failed')
  }

  async function handleDelete(id: string) {
    await fetch(`/api/outreach/prospects?id=${id}`, { method: 'DELETE' })
    setProspects(prev => prev.filter(p => p.id !== id))
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/outreach/prospects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: status as Prospect['status'] } : p))
  }

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => selected.size === prospects.length
    ? setSelected(new Set())
    : setSelected(new Set(prospects.map(p => p.id)))

  const categories = [...new Set(prospects.map(p => p.category).filter(Boolean))]
  const withEmail  = prospects.filter(p => p.email).length
  const contacted  = prospects.filter(p => p.status === 'contacted').length
  const donated    = prospects.filter(p => p.status === 'donated').length
  const noApiKey   = discoverError?.includes('GOOGLE_PLACES_API_KEY')

  const selectStyle = {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    color: '#9ca3af',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    outline: 'none',
  }

  return (
    <div className="p-8" style={{ minHeight: '100vh', background: 'var(--bat-black)' }}>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bat-gold)', boxShadow: '0 0 16px rgba(245,197,24,0.3)' }}>
              <Mail className="w-4 h-4" style={{ color: '#0a0a0f' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f1f5f9' }}>Fundraising Intel</h1>
          </div>
          <p className="text-sm ml-11" style={{ color: '#4b5563' }}>Discover Austin donors · scrape contacts · send campaigns</p>
        </div>
        <button onClick={load} style={{ color: '#4b5563' }} className="hover:text-gray-300 transition-colors mt-1">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Prospects', value: prospects.length, color: '#f1f5f9' },
          { label: 'Have Email',      value: withEmail,         color: '#f5c518' },
          { label: 'Contacted',       value: contacted,         color: '#818cf8' },
          { label: 'Donated',         value: donated,           color: '#4ade80' },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4b5563' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Discovery Panel */}
      <Card className="mb-6 overflow-hidden">
        <button
          onClick={() => setShowDiscover(h => !h)}
          className="w-full flex items-center justify-between px-6 py-4 transition-colors"
          style={{ borderBottom: showDiscover ? '1px solid var(--bat-border)' : 'none' }}
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4" style={{ color: '#f5c518' }} />
            <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Discover Prospects</span>
            <span className="text-xs" style={{ color: '#4b5563' }}>Search Google Maps · scrape contact emails automatically</span>
          </div>
          {showDiscover
            ? <ChevronUp className="w-4 h-4" style={{ color: '#4b5563' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: '#4b5563' }} />}
        </button>

        {showDiscover && (
          <div className="p-6 space-y-5">
            {noApiKey && (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f5c518' }} />
                <p className="text-sm" style={{ color: '#d1b84a' }}>Add <code className="px-1 rounded text-xs" style={{ background: 'rgba(245,197,24,0.1)' }}>GOOGLE_PLACES_API_KEY</code> to .env.local</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map(p => (
                <label key={p.value}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedPreset === p.value ? 'rgba(245,197,24,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedPreset === p.value ? 'rgba(245,197,24,0.3)' : '#2a2a3a'}`,
                  }}
                >
                  <input type="radio" name="preset" value={p.value} checked={selectedPreset === p.value}
                    onChange={() => setSelectedPreset(p.value)} className="mt-0.5 accent-yellow-400" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: selectedPreset === p.value ? '#f5c518' : '#d1d5db' }}>{p.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#4b5563' }}>Custom Query</p>
              <input
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder='e.g. "Indian catering company Austin TX"'
                style={{ ...selectStyle, width: '100%', padding: '10px 14px', color: '#d1d5db' }}
              />
            </div>

            {discoverResult && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                <p className="text-sm" style={{ color: '#86efac' }}>
                  Found <strong>{discoverResult.added}</strong> new prospects · <strong>{discoverResult.with_email}</strong> have emails
                </p>
              </div>
            )}

            {discoverError && !noApiKey && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
                <p className="text-sm" style={{ color: '#fca5a5' }}>{discoverError}</p>
              </div>
            )}

            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{ background: '#f5c518', color: '#0a0a0f', boxShadow: discovering ? 'none' : '0 0 20px rgba(245,197,24,0.25)' }}
            >
              {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {discovering ? 'Scanning Gotham...' : 'Discover Prospects'}
            </button>
          </div>
        )}
      </Card>

      {/* Prospects Table */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--bat-border)' }}>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="donated">Donated</option>
              <option value="declined">Declined</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c!} value={c!}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => setShowSendPanel(s => !s)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(245,197,24,0.12)', color: '#f5c518', border: '1px solid rgba(245,197,24,0.25)' }}
              >
                <Send className="w-3.5 h-3.5" />
                Send to {selected.size}
              </button>
            )}
            <button
              onClick={() => handleSend(true)}
              disabled={sending || withEmail === 0}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid #2a2a3a' }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              All with email ({withEmail})
            </button>
          </div>
        </div>

        {/* Send panel */}
        {showSendPanel && selected.size > 0 && (
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--bat-border)', background: 'rgba(245,197,24,0.04)' }}>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Optional: add a custom paragraph to the fundraising email..."
              rows={2}
              style={{ ...selectStyle, width: '100%', padding: '10px 14px', color: '#d1d5db', resize: 'none' }}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleSend(false)} disabled={sending}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
                style={{ background: '#f5c518', color: '#0a0a0f' }}>
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Now
              </button>
              <button onClick={() => setShowSendPanel(false)}
                className="text-sm px-4 py-2 rounded-xl transition-colors"
                style={{ color: '#6b7280' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Result banners */}
        {sendResult && (
          <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--bat-border)', background: 'rgba(74,222,128,0.06)' }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />
            <p className="text-sm" style={{ color: '#86efac' }}>Sent {sendResult.sent} emails{sendResult.failed > 0 ? ` · ${sendResult.failed} failed` : ''}</p>
          </div>
        )}
        {sendError && (
          <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--bat-border)', background: 'rgba(239,68,68,0.06)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#f87171' }} />
            <p className="text-sm" style={{ color: '#fca5a5' }}>{sendError}</p>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bat-border)' }}>
              <th className="px-5 py-3 w-10">
                <input type="checkbox" checked={selected.size === prospects.length && prospects.length > 0}
                  onChange={toggleAll} className="accent-yellow-400" />
              </th>
              {['Business', 'Category', 'Contact', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#4b5563' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: '#f5c518' }} />
                <p className="text-sm" style={{ color: '#4b5563' }}>Scanning the city...</p>
              </td></tr>
            ) : prospects.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center">
                <p className="text-sm" style={{ color: '#4b5563' }}>No prospects yet — hit Discover to find Austin donors.</p>
              </td></tr>
            ) : prospects.map((p, i) => (
              <tr key={p.id}
                style={{
                  borderBottom: i < prospects.length - 1 ? '1px solid rgba(42,42,58,0.5)' : 'none',
                  background: selected.has(p.id) ? 'rgba(245,197,24,0.04)' : 'transparent',
                }}
              >
                <td className="px-5 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-yellow-400" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{p.business_name}</p>
                  {p.location && (
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#4b5563' }}>
                      <MapPin className="w-3 h-3" />{p.location.split(',').slice(0, 2).join(',')}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: '#6b7280' }}>{p.category || '—'}</span>
                </td>
                <td className="px-4 py-3 space-y-1">
                  {p.email ? (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#f5c518' }}>
                      <Mail className="w-3 h-3" />{p.email}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: '#2a2a3a' }}>No email</p>
                  )}
                  {p.phone && <p className="text-xs flex items-center gap-1.5" style={{ color: '#4b5563' }}><Phone className="w-3 h-3" />{p.phone}</p>}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1.5 hover:underline"
                      style={{ color: '#4b5563' }}>
                      <Globe className="w-3 h-3" />{p.website.replace(/^https?:\/\//, '').slice(0, 28)}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={e => handleStatusChange(p.id, e.target.value)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer border-0 outline-none"
                    style={{ background: STATUS_STYLE[p.status].bg, color: STATUS_STYLE[p.status].color }}
                  >
                    {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(p.id)}
                    className="transition-colors"
                    style={{ color: '#2a2a3a' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a2a3a'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
