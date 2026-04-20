'use client'

import { useEffect, useState } from 'react'
import { Send, Users, CheckCircle, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const AUDIENCE_OPTIONS = [
  { value: 'competitors', label: 'All Competitors', desc: 'Everyone with role: competitor' },
  { value: 'liaisons', label: 'All Liaisons', desc: 'Everyone with role: liaison' },
  { value: 'board', label: 'Board Members', desc: 'Everyone with role: admin' },
  { value: 'unpaid', label: 'Unpaid Ticket Holders', desc: 'People with reserved/assigned tickets' },
  { value: 'paid', label: 'Paid Ticket Holders', desc: 'People with paid/picked-up tickets' },
  { value: 'all', label: 'Everyone', desc: 'All people in the system (excl. placeholders)' },
]

const TEMPLATE_OPTIONS = [
  { value: 'reminder', label: 'Payment Reminder', desc: 'Outstanding ticket payment reminder' },
  { value: 'confirmation', label: 'Registration Confirmed', desc: 'Confirm their spot at the show' },
  { value: 'fundraising', label: 'Fundraising Ask', desc: 'Ask for support/donations' },
  { value: 'logistics', label: 'Logistics Update', desc: 'Share event logistics info' },
  { value: 'custom', label: 'Custom Message', desc: 'Write your own message body' },
]

type OutreachRecord = {
  id: string
  name: string
  email: string
  type: string
  status: string
  last_sent_at: string | null
  notes: string | null
  people: { first_name: string; last_name: string } | null
}

export default function OutreachPage() {
  const [audience, setAudience] = useState('competitors')
  const [templateType, setTemplateType] = useState('reminder')
  const [subjectOverride, setSubjectOverride] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewRecipients, setPreviewRecipients] = useState<{ name: string; email: string }[] | null>(null)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState('')

  const [records, setRecords] = useState<OutreachRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showHistory, setShowHistory] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchHistory() }, [typeFilter, statusFilter])

  async function fetchHistory() {
    setLoadingHistory(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/dashboard/outreach?${params}`)
    const data = await res.json()
    setRecords(Array.isArray(data) ? data : [])
    setLoadingHistory(false)
  }

  async function handlePreview() {
    setPreviewing(true)
    setPreviewRecipients(null)
    const res = await fetch('/api/dashboard/outreach/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, type: templateType, dry_run: true }),
    })
    const data = await res.json()
    setPreviewing(false)
    if (res.ok) setPreviewRecipients(data.recipients)
  }

  async function handleSend() {
    if (!confirm(`Send to ${previewRecipients ? previewRecipients.length : '?'} recipients? This will send real emails.`)) return
    setSending(true)
    setResult(null)
    setError('')
    const res = await fetch('/api/dashboard/outreach/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audience,
        type: templateType,
        subject_override: subjectOverride || undefined,
        custom_message: customMessage || undefined,
      }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) {
      setResult(data)
      setPreviewRecipients(null)
      fetchHistory()
    } else {
      setError(data.error || 'Send failed')
    }
  }

  const selectedAudience = AUDIENCE_OPTIONS.find(a => a.value === audience)
  const selectedTemplate = TEMPLATE_OPTIONS.find(t => t.value === templateType)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Outreach</h1>
        <p className="text-gray-500 mt-1">Send bulk emails to your audience — competitors, liaisons, ticket holders, or everyone.</p>
      </div>

      {/* Campaign Builder */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">New Campaign</h2>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
            <div className="space-y-2">
              {AUDIENCE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${audience === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="audience" value={opt.value} checked={audience === opt.value}
                    onChange={() => { setAudience(opt.value); setPreviewRecipients(null) }}
                    className="mt-0.5 accent-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
            <div className="space-y-2">
              {TEMPLATE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${templateType === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="template" value={opt.value} checked={templateType === opt.value}
                    onChange={() => setTemplateType(opt.value)}
                    className="mt-0.5 accent-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom message */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {templateType === 'custom' ? 'Message Body *' : 'Extra Message (optional)'}
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={4}
                placeholder={templateType === 'custom' ? 'Write your full message here...' : 'Add any extra info to include in the email...'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line Override (optional)</label>
              <input
                value={subjectOverride}
                onChange={e => setSubjectOverride(e.target.value)}
                placeholder="Leave blank to use default subject"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Preview recipients */}
        {previewRecipients && (
          <div className="mb-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">{previewRecipients.length} recipients will receive this email</p>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {previewRecipients.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="font-medium w-40 truncate">{r.name}</span>
                  <span className="text-gray-400">{r.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Sent {result.sent} emails successfully{result.failed > 0 ? ` (${result.failed} failed)` : ''}</p>
              <p className="text-xs text-green-600">Campaign delivered to {result.sent} of {result.total} recipients</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={previewing || sending}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Preview Recipients
          </button>

          <button
            onClick={handleSend}
            disabled={sending || previewing || (templateType === 'custom' && !customMessage.trim())}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : `Send to ${selectedAudience?.label}`}
          </button>
        </div>
      </div>

      {/* Send History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-800">Send History</h2>
            <span className="text-xs text-gray-400">{records.length} records</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={e => { e.stopPropagation(); fetchHistory() }}
              className="text-gray-400 hover:text-gray-600 p-1">
              <RefreshCw className="w-4 h-4" />
            </button>
            {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {showHistory && (
          <>
            <div className="flex gap-3 px-6 pb-4 border-b border-gray-100">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                <option value="">All types</option>
                <option value="reminder">Reminder</option>
                <option value="confirmation">Confirmation</option>
                <option value="fundraising">Fundraising</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                <option value="">All statuses</option>
                <option value="not_sent">Not Sent</option>
                <option value="sent">Sent</option>
                <option value="responded">Responded</option>
              </select>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Recipient</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Sent At</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingHistory ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No outreach history yet</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">
                        {r.people ? `${r.people.first_name} ${r.people.last_name}` : r.name || '—'}
                      </p>
                      <p className="text-gray-400 text-xs">{r.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium text-gray-600 capitalize">{r.type}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'sent' ? 'bg-green-100 text-green-700' :
                        r.status === 'responded' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {r.last_sent_at ? new Date(r.last_sent_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
