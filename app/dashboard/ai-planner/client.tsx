'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Sparkles, Database, ChevronDown, ChevronUp, Plus, Trash2, RefreshCw } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ContextEntry = {
  id: string
  key: string
  label: string
  content: string
  updated_at: string
}

const QUICK_PROMPTS = [
  { label: 'Generate Saturday Schedule', prompt: 'Generate a full Saturday show-day schedule. Fetch all teams, board members, their travel data, and any context you have. Assign board members to tasks — airport dropoffs, food pickups, venue roles, hospitality, tech, concessions. Make sure you balance workload and respect everyone\'s availability.' },
  { label: 'Thursday Airport Runs', prompt: 'Plan all Thursday airport pickup runs. Pull team travel data and board member availability. Group flights by proximity in time. Assign van drivers and support people for each pickup. Include timing buffers and a route order.' },
  { label: 'Tech Time Pipeline', prompt: 'Build the Friday tech time pipeline for all 8 teams. Assign each team a 45–60 min slot in a logical order. Assign board members to each slot (at least 2 per slot). Give the full schedule with times and assignments.' },
  { label: 'Food Pickup Plan', prompt: 'Pull the food logistics context and create a detailed food pickup schedule across all days. Assign board members to each pickup. Include pickup location, time, what\'s being picked up, and who\'s doing it.' },
  { label: 'Check for Conflicts', prompt: 'Analyze the current schedule and availability data. Identify any conflicts — overlapping assignments, people scheduled when they\'re unavailable, understaffed slots, van drivers without a vehicle assigned. Give me a conflict report with severity.' },
  { label: 'Van Assignments', prompt: 'Create a van assignment plan for the full weekend. List each van with its assigned driver, support person, and the routes/runs it\'s doing across Thursday, Friday, Saturday, and Sunday.' },
  { label: 'Sunday Dropoffs', prompt: 'Plan Sunday airport dropoff runs. Pull team travel data for departure flights. Assign vans and drivers. Group teams by flight time. Build a full dropoff schedule with departure times from hotel.' },
  { label: 'Board Availability Summary', prompt: 'Pull all board members and their availability/conflict data. Give me a summary table: each person\'s name, role, and which time windows they\'re unavailable this weekend.' },
]

const SEED_CONTEXTS = [
  {
    key: 'food_logistics',
    label: 'Food Logistics',
    content: `THURSDAY:
- Welcome snacks: picked up by Hospitality Chair + 1 board from [store] by 2pm
- Team dinner: catered delivery at hotel 7pm

FRIDAY:
- Board breakfast: [location] 8am
- Lunch: [restaurant] pickup 12pm, 2 people needed, must arrive by 12:30pm
- Tech time snacks: light snacks at venue all day

SATURDAY (SHOW DAY):
- Board pre-show breakfast: [location] 7am
- Team meal boxes: picked up by 11am, store at venue green room
- Concessions: volunteer team manages sales during show
- Post-show team dinner: catered at [venue], delivery 8pm
- Judge dinner: separate catered order, delivery 6:30pm

SUNDAY:
- Checkout breakfast: hotel lobby, 8-10am
- Farewell snacks: bagged and distributed before teams leave

Note: Update this with actual restaurant names and order sizes once finalized.`
  },
  {
    key: 'venue_times',
    label: 'Venue Booking Windows',
    content: `THURSDAY:
- Hotel block: checkin from 3pm
- No venue access

FRIDAY - Tech Time Venue:
- Load-in access: 8:00am
- Tech time slots run: 9am–8pm
- Load-out: 8pm–10pm

SATURDAY - Show Venue:
- Board arrives: 7:00am
- Doors open to public: 5:30pm (adjust per show time)
- Show start: 6:00pm
- Show end: ~10:00pm
- Venue must be cleared by: 12:00am midnight

SUNDAY:
- Hotel checkout: 11am
- No venue access needed

Note: Update with actual venue names and addresses.`
  },
  {
    key: 'van_fleet',
    label: 'Van Fleet',
    content: `15-PASSENGER VANS:
- Van 1: [driver name TBD] — primary airport van
- Van 2: [driver name TBD] — secondary airport van
- Van 3: [driver name TBD] — team transport van

UHUAL / BOX TRUCKS:
- Truck 1: [driver name TBD] — equipment/props
- Truck 2: [driver name TBD] — backup / merch

DRIVER REQUIREMENTS:
- Must be 21+ and on rental agreement
- Only board members who confirmed van driving experience
- Each van should have 1 driver + 1 navigator/support

Note: Update with actual driver names from board roster.`
  },
  {
    key: 'team_travel_notes',
    label: 'Team Travel Overview',
    content: `ARRIVAL ORDER (approximate — update with actual flight times):

THURSDAY ARRIVALS:
- UTD: driving from Dallas, arriving ~2pm
- GT: driving from Atlanta or short flight
- WASHU: flight, arriving ~4-6pm
- ILLINI: driving or flight, arriving ~3-5pm

FRIDAY ARRIVALS:
- UCLA: flight, arriving morning
- UCSD: flight, arriving morning
- UVA: flight, arriving ~11am
- BU: flight, arriving ~noon

DEPARTURE ORDER (SUNDAY):
Most teams depart Sunday afternoon/evening.
BU and West Coast teams may have early Monday flights.

Note: Feed actual itinerary data using the travel form. Ask captains/liaisons to submit flight numbers and times.`
  },
]

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-gray-700'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
        <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
        <p className={`text-xs mt-1.5 ${isUser ? 'text-indigo-300' : 'text-gray-400'}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export function AIPlannerClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hey! I'm your Raas Rodeo logistics AI. I know the full event structure — teams, travel windows, venues, food chains, van fleet, and board roles.

Here's what I can do:
• Generate full schedules for any day (Thu–Sun) or the entire weekend
• Plan airport pickup/dropoff runs around actual flight times
• Build the tech time pipeline and assign board members to slots
• Create food pickup chains with specific assignments
• Check for scheduling conflicts and suggest fixes
• Answer any logistics question in plain language

To get started, add your actual data using the **Data** panel (flight times, board conflicts, van drivers), then hit one of the quick prompts — or just ask me anything.`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [panel, setPanel] = useState<'chat' | 'data'>('chat')
  const [contexts, setContexts] = useState<ContextEntry[]>([])
  const [showContextForm, setShowContextForm] = useState(false)
  const [newCtx, setNewCtx] = useState({ key: '', label: '', content: '' })
  const [savingCtx, setSavingCtx] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadContexts = useCallback(async () => {
    const res = await fetch('/api/ai-planner/context')
    if (res.ok) {
      const data = await res.json()
      setContexts(Array.isArray(data) ? data : [])
    }
  }, [])

  useEffect(() => { loadContexts() }, [loadContexts])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return
    setInput('')
    setShowQuickPrompts(false)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText, timestamp: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai-planner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m))
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: `Error: ${e instanceof Error ? e.message : 'Something went wrong'}` }
        : m))
    } finally {
      setLoading(false)
    }
  }

  async function saveContext() {
    if (!newCtx.key || !newCtx.label || !newCtx.content) return
    setSavingCtx(true)
    await fetch('/api/ai-planner/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCtx),
    })
    setNewCtx({ key: '', label: '', content: '' })
    setShowContextForm(false)
    setSavingCtx(false)
    loadContexts()
  }

  async function deleteContext(key: string) {
    await fetch('/api/ai-planner/context', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    loadContexts()
  }

  async function seedDefaultContexts() {
    for (const ctx of SEED_CONTEXTS) {
      await fetch('/api/ai-planner/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx),
      })
    }
    loadContexts()
  }

  return (
    <div className="flex h-[calc(100vh-0px)] bg-gray-50">
      {/* Left panel */}
      <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-700 flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-white font-bold text-lg">AI Planner</h1>
          </div>
          <p className="text-gray-400 text-xs">Board-only logistics assistant</p>
        </div>

        <div className="flex border-b border-gray-700">
          {(['chat', 'data'] as const).map(t => (
            <button key={t} onClick={() => setPanel(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${panel === t ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {t === 'chat' ? 'Chat' : 'Data & Context'}
            </button>
          ))}
        </div>

        {panel === 'chat' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-gray-500 text-xs uppercase tracking-wide px-2 py-1">Quick Prompts</p>
            {QUICK_PROMPTS.map(q => (
              <button key={q.label} onClick={() => send(q.prompt)}
                disabled={loading}
                className="w-full text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                {q.label}
              </button>
            ))}
          </div>
        )}

        {panel === 'data' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Context Data</p>
              <div className="flex gap-1">
                <button onClick={loadContexts} title="Refresh" className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button onClick={() => setShowContextForm(s => !s)} title="Add" className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {contexts.length === 0 && (
              <div className="text-center py-4">
                <Database className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs mb-3">No context data yet.</p>
                <button onClick={seedDefaultContexts}
                  className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Seed Default Templates
                </button>
              </div>
            )}

            {contexts.map(ctx => (
              <div key={ctx.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{ctx.label}</p>
                    <p className="text-gray-500 text-xs">{ctx.key}</p>
                  </div>
                  <button onClick={() => deleteContext(ctx.key)} className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{ctx.content.slice(0, 100)}...</p>
              </div>
            ))}

            {showContextForm && (
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <input placeholder="Key (e.g. food_logistics)" value={newCtx.key}
                  onChange={e => setNewCtx(n => ({ ...n, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input placeholder="Label (e.g. Food Logistics)" value={newCtx.label}
                  onChange={e => setNewCtx(n => ({ ...n, label: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <textarea placeholder="Context content..." value={newCtx.content}
                  onChange={e => setNewCtx(n => ({ ...n, content: e.target.value }))}
                  rows={6} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                <div className="flex gap-2">
                  <button onClick={saveContext} disabled={savingCtx}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-1.5 rounded transition-colors">
                    {savingCtx ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setShowContextForm(false); setNewCtx({ key: '', label: '', content: '' }) }}
                    className="flex-1 text-gray-400 hover:text-gray-200 text-xs py-1.5 rounded border border-gray-600 hover:border-gray-500 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts toggle on mobile */}
        <div className="border-t border-gray-200 bg-white">
          <button onClick={() => setShowQuickPrompts(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <span>Quick prompts</span>
            {showQuickPrompts ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          {showQuickPrompts && (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {QUICK_PROMPTS.map(q => (
                <button key={q.label} onClick={() => send(q.prompt)} disabled={loading}
                  className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about the schedule, request assignments, check conflicts..."
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-50"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
