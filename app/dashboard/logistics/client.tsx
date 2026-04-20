'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Circle, Clock, Plus, X, RefreshCw, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

type TaskStatus = 'not_started' | 'in_progress' | 'done'

type Task = {
  id: string
  title: string
  description?: string
  category?: string
  status: TaskStatus
  start_time?: string
  end_time?: string
  people?: { id: string; first_name: string; last_name: string } | null
  teams?: { id: string; name: string } | null
}

const STATUS_CYCLE: TaskStatus[] = ['not_started', 'in_progress', 'done']

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ReactNode; label: string; color: string }> = {
  not_started: { icon: <Circle className="w-5 h-5" />, label: 'Not Started', color: 'text-gray-400' },
  in_progress: { icon: <Clock className="w-5 h-5" />, label: 'In Progress', color: 'text-yellow-500' },
  done: { icon: <CheckCircle className="w-5 h-5" />, label: 'Done', color: 'text-green-500' },
}

const CATEGORIES = ['transport', 'food', 'show', 'hotel', 'logistics']

const AI_PROMPTS = [
  { label: 'Saturday Master Schedule', prompt: 'Generate the FULL Saturday show-day minute-by-minute schedule for every board member. Fetch all people, teams, and MUST fetch schedule_context with key "saturday_reference_schedule". Create a task for every person at every time slot — from 5 AM wake-up through midnight. Include all van runs, venue setup, show operations, AP party. Should produce 200+ tasks covering everyone.' },
  { label: 'Friday Master Schedule', prompt: 'Generate the FULL Friday setup-day minute-by-minute schedule for every board member. Fetch all people, teams, and MUST fetch schedule_context with key "friday_reference_schedule". Create tasks from 7 AM through midnight — airport pickups, tech time pipeline, mixer, dinner, van coordination. Should produce 150+ tasks covering everyone.' },
  { label: 'Thursday Airport Runs', prompt: 'Generate all Thursday airport pickup tasks. Fetch teams, people, and context. Create specific tasks for each pickup run — which team, exact time, van name (Mr.Freeze/Joker/Bane/Riddler), driver name, and destination (Hilton Garden Inn).' },
  { label: 'Sunday Dropoffs', prompt: 'Generate Sunday airport dropoff tasks. Fetch team travel context and all people. Create tasks grouped by flight departure time, assign vans by driver (Saanvika=Mr.Freeze, Arham=Joker, Srimaan=Bane, Diya=Riddler).' },
  { label: 'Food Pickup Chain', prompt: 'Create all food pickup and delivery tasks across Thursday-Sunday. Fetch food logistics context and people. Each task: what food, from where, by when, which van, who goes.' },
  { label: 'Full Weekend', prompt: 'Generate the complete Raas Rodeo 2026 weekend task list (Thursday-Sunday). Fetch all people, teams, AND both saturday_reference_schedule and friday_reference_schedule context. Cover every operational area at minute-by-minute granularity. Produce 400+ tasks total.' },
]

export function LogisticsClient({ canEdit }: { canEdit: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [form, setForm] = useState({
    title: '', description: '', category: 'logistics', status: 'not_started' as TaskStatus,
    start_time: '', end_time: '',
  })

  // AI generate state
  const [showAI, setShowAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiImporting, setAiImporting] = useState(false)
  const [aiResult, setAiResult] = useState<{ count: number; summary: string } | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterCategory !== 'all') params.set('category', filterCategory)
    const res = await fetch(`/api/dashboard/tasks?${params}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterStatus, filterCategory])

  useEffect(() => { load() }, [load])

  async function cycleStatus(task: Task) {
    if (!canEdit) return
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length]
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    await fetch(`/api/dashboard/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }

  async function deleteTask(id: string) {
    if (!canEdit) return
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/dashboard/tasks/${id}`, { method: 'DELETE' })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return
    setSaving(true)
    const body: Record<string, string> = { title: form.title, category: form.category, status: form.status }
    if (form.description) body.description = form.description
    if (form.start_time) body.start_time = form.start_time
    if (form.end_time) body.end_time = form.end_time
    const res = await fetch('/api/dashboard/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const newTask = await res.json()
    setSaving(false)
    if (res.ok) {
      setTasks(prev => [...prev, newTask])
      setForm({ title: '', description: '', category: 'logistics', status: 'not_started', start_time: '', end_time: '' })
      setShowForm(false)
    }
  }

  async function handleGenerate(prompt: string) {
    if (!canEdit || aiGenerating) return
    const text = prompt || aiPrompt
    if (!text.trim()) return
    setAiGenerating(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      })
      const data = await res.json()
      if (res.ok && data.tasks) {
        setTasks(prev => [...data.tasks, ...prev])
        setAiResult({ count: data.count, summary: data.summary })
        setAiPrompt('')
      }
    } finally {
      setAiGenerating(false)
    }
  }

  async function handleImport(day: string) {
    if (!canEdit || aiImporting) return
    setAiImporting(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai-planner/import-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day }),
      })
      const data = await res.json()
      if (res.ok) {
        await load()
        setAiResult({ count: data.count, summary: data.summary })
      } else {
        setAiResult({ count: 0, summary: `Error: ${data.error}` })
      }
    } finally {
      setAiImporting(false)
    }
  }

  const filtered = tasks.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterCategory === 'all' || t.category === filterCategory)
  )

  const counts = { not_started: 0, in_progress: 0, done: 0 }
  for (const t of tasks) counts[t.status]++

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {canEdit ? 'Assign and track show-day tasks.' : 'View tasks — contact the board to make changes.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canEdit && (
            <button onClick={() => setShowForm(s => !s)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.keys(counts) as TaskStatus[]).map(s => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${STATUS_CONFIG[s].color}`}>{counts[s]}</p>
            <p className="text-xs text-gray-500 mt-1">{STATUS_CONFIG[s].label}</p>
          </div>
        ))}
      </div>

      {/* AI Schedule Generator */}
      {canEdit && (
        <div className="mb-6">
          <button
            onClick={() => { setShowAI(s => !s); setAiResult(null) }}
            className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-5 py-3.5 hover:border-indigo-300 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-700">AI Schedule Generator</span>
              <span className="text-xs text-indigo-400">— describe what you need, tasks go straight to the board</span>
            </div>
            {showAI ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
          </button>

          {showAI && (
            <div className="bg-white border border-indigo-200 border-t-0 rounded-b-xl p-5 space-y-4">

              {/* Import master schedule section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Import Full Master Schedule</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Saturday (Show Day)', day: 'saturday' },
                    { label: 'Friday (Setup Day)', day: 'friday' },
                  ].map(({ label, day }) => (
                    <button
                      key={day}
                      onClick={() => handleImport(day)}
                      disabled={aiImporting}
                      className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {aiImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Imports every person&apos;s minute-by-minute tasks directly from your master schedule.</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Generate Custom Tasks</p>
                {/* Quick prompt chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {AI_PROMPTS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handleGenerate(p.prompt)}
                      disabled={aiGenerating}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom prompt */}
                <div className="flex gap-3">
                  <input
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGenerate(aiPrompt) }}
                    placeholder="Describe what to schedule... e.g. 'Plan all van pickups for Thursday arrivals'"
                    disabled={aiGenerating}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleGenerate(aiPrompt)}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {aiGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate</>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {(aiGenerating || aiImporting) && (
                <div className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" />
                  <p className="text-sm text-indigo-700">
                    {aiImporting ? 'Importing master schedule — pulling every person\'s minute-by-minute tasks...' : 'AI is building the schedule — tasks will appear below when ready...'}
                  </p>
                </div>
              )}

              {/* Result */}
              {aiResult && !aiGenerating && !aiImporting && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Added {aiResult.count} tasks to the board</p>
                    {aiResult.summary && <p className="text-xs text-green-600 mt-0.5">{aiResult.summary}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Task Form */}
      {showForm && canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">New Task</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
                {saving ? 'Adding...' : 'Add Task'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No tasks found.</p>
          {canEdit && <p className="text-gray-300 text-xs mt-1">Use AI Generate or click &quot;Add Task&quot; to create one.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const cfg = STATUS_CONFIG[task.status]
            return (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4">
                <button
                  onClick={() => cycleStatus(task)}
                  disabled={!canEdit}
                  title={canEdit ? `Mark as ${STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length]}` : cfg.label}
                  className={`mt-0.5 flex-shrink-0 ${cfg.color} ${canEdit ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'} transition-opacity`}
                >
                  {cfg.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </span>
                    {task.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{task.category}</span>
                    )}
                    {(task.start_time || task.end_time) && (
                      <span className="text-xs text-gray-400">
                        {task.start_time && task.start_time.slice(11, 16)}{task.end_time && ` – ${task.end_time.slice(11, 16)}`}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                  )}
                </div>
                {canEdit && (
                  <button onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
