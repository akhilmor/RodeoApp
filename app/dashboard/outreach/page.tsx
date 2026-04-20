'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search, Send, Loader2, CheckCircle, AlertCircle,
  RefreshCw, Trash2, Mail, Globe, Phone, MapPin, ChevronDown, ChevronUp, Plus
} from 'lucide-react'

type Prospect = {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  category: string | null
  status: 'new' | 'contacted' | 'responded' | 'donated' | 'declined'
  last_contacted_at: string | null
  notes: string | null
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  responded: 'bg-yellow-100 text-yellow-700',
  donated: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
}

const PRESETS = [
  { value: 'indian_businesses', label: 'Indian Businesses', desc: 'Restaurants, groceries, shops' },
  { value: 'community_orgs', label: 'Community Orgs', desc: 'Temples, cultural associations' },
  { value: 'donors', label: 'Indian Professionals', desc: 'Doctors, lawyers, business owners' },
  { value: 'local_sponsors', label: 'Austin Sponsors', desc: 'Local companies with giving programs' },
]

export default function OutreachPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Discovery state
  const [discovering, setDiscovering] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<{ added: number; with_email: number } | null>(null)
  const [discoverError, setDiscoverError] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('indian_businesses')
  const [customQuery, setCustomQuery] = useState('')
  const [showDiscover, setShowDiscover] = useState(true)

  // Send state
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [sendError, setSendError] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showSendOptions, setShowSendOptions] = useState(false)

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
      body: JSON.stringify({
        preset: selectedPreset,
        custom_query: customQuery || undefined,
      }),
    })
    const data = await res.json()
    setDiscovering(false)
    if (res.ok) {
      setDiscoverResult(data)
      load()
    } else {
      setDiscoverError(data.error || 'Discovery failed')
    }
  }

  async function handleSend(sendAll = false) {
    if (!sendAll && selected.size === 0) return
    if (!confirm(`Send fundraising emails to ${sendAll ? 'all prospects with emails' : selected.size + ' selected prospects'}?`)) return
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
    if (res.ok) {
      setSendResult(data)
      setSelected(new Set())
      load()
    } else {
      setSendError(data.error || 'Send failed')
    }
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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(prospects.map(p => p.id)))
    }
  }

  const categories = [...new Set(prospects.map(p => p.category).filter(Boolean))]
  const withEmail = prospects.filter(p => p.email).length
  const contacted = prospects.filter(p => p.status === 'contacted').length
  const donated = prospects.filter(p => p.status === 'donated').length

  const noApiKey = discoverError?.includes('GOOGLE_PLACES_API_KEY')

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fundraising Outreach</h1>
        <p className="text-gray-500 mt-1">Discover Austin-area donors, scrape their contact info, and send fundraising campaigns.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Prospects', value: prospects.length },
          { label: 'Have Email', value: withEmail },
          { label: 'Contacted', value: contacted },
          { label: 'Donated', value: donated },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Discovery Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <button
          onClick={() => setShowDiscover(h => !h)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-500" />
            <span className="text-base font-semibold text-gray-800">Discover New Prospects</span>
            <span className="text-xs text-gray-400">— searches Google Maps + scrapes contact emails automatically</span>
          </div>
          {showDiscover ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showDiscover && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
            {noApiKey && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Google Places API key required</p>
                  <p className="text-xs text-amber-700 mt-0.5">Add <code className="bg-amber-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env.local</code>. Get a free key at <strong>console.cloud.google.com</strong> → enable "Places API" → create credentials. Free $200/month credit.</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Search Preset</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <label key={p.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPreset === p.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="preset" value={p.value} checked={selectedPreset === p.value}
                      onChange={() => setSelectedPreset(p.value)} className="mt-0.5 accent-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Or custom search query</p>
              <input
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder='e.g. "Indian catering company Austin TX"'
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {discoverResult && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Found <strong>{discoverResult.added} new prospects</strong> — {discoverResult.with_email} have email addresses
                </p>
              </div>
            )}

            {discoverError && !noApiKey && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{discoverError}</p>
              </div>
            )}

            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {discovering ? 'Searching & scraping emails...' : 'Discover Prospects'}
            </button>
          </div>
        )}
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="donated">Donated</option>
              <option value="declined">Declined</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
              <option value="">All categories</option>
              {categories.map(c => <option key={c!}>{c}</option>)}
            </select>
            <button onClick={load} className="text-gray-400 hover:text-gray-600 p-1">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => setShowSendOptions(s => !s)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send to {selected.size} selected
              </button>
            )}
            <button
              onClick={() => handleSend(true)}
              disabled={sending || withEmail === 0}
              className="flex items-center gap-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send to all with email ({withEmail})
            </button>
          </div>
        </div>

        {/* Send options panel */}
        {showSendOptions && selected.size > 0 && (
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Optional: add a custom paragraph to include in the fundraising email..."
              rows={2}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSend(false)}
                disabled={sending}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Now
              </button>
              <button onClick={() => setShowSendOptions(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        )}

        {(sendResult || sendError) && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 ${sendResult ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            {sendResult ? (
              <><CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-800">Sent {sendResult.sent} emails{sendResult.failed > 0 ? ` (${sendResult.failed} failed)` : ''}</p></>
            ) : (
              <><AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{sendError}</p></>
            )}
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={selected.size === prospects.length && prospects.length > 0}
                  onChange={toggleAll} className="accent-indigo-600" />
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Business</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...
              </td></tr>
            ) : prospects.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                No prospects yet — click &quot;Discover Prospects&quot; to find Austin-area contacts.
              </td></tr>
            ) : prospects.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 ${selected.has(p.id) ? 'bg-indigo-50/40' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                    className="accent-indigo-600" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.business_name}</p>
                  {p.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.address.split(',').slice(0, 2).join(',')}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">{p.category || '—'}</span>
                </td>
                <td className="px-4 py-3 space-y-0.5">
                  {p.email ? (
                    <p className="text-xs text-indigo-600 flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</p>
                  ) : (
                    <p className="text-xs text-gray-300">No email found</p>
                  )}
                  {p.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</p>}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 flex items-center gap-1 hover:text-indigo-600">
                      <Globe className="w-3 h-3" />{p.website.replace(/^https?:\/\//, '').slice(0, 30)}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={e => handleStatusChange(p.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_STYLE[p.status]}`}
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="responded">responded</option>
                    <option value="donated">donated</option>
                    <option value="declined">declined</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
