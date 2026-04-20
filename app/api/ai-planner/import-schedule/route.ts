import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Maps person names from the reference schedule to categories
function inferCategory(task: string): 'transport' | 'food' | 'show' | 'hotel' | 'logistics' {
  const t = task.toLowerCase()
  if (t.includes('drive') || t.includes('van') || t.includes('uhaul') || t.includes('airport') || t.includes('pick up') || t.includes('drop') || t.includes('parking')) return 'transport'
  if (t.includes('food') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('eat') || t.includes('snack') || t.includes('coffee') || t.includes('meal') || t.includes('catering')) return 'food'
  if (t.includes('show') || t.includes('stage') || t.includes('tech') || t.includes('sound') || t.includes('light') || t.includes('perform') || t.includes('rehearsal') || t.includes('pmp') || t.includes('a/v') || t.includes('doors') || t.includes('ap') || t.includes('mixer') || t.includes('concession')) return 'show'
  if (t.includes('hotel') || t.includes('hilton') || t.includes('room') || t.includes('check') || t.includes('wampus') || t.includes('la quinta') || t.includes('hospitality') || t.includes('welcome')) return 'hotel'
  return 'logistics'
}

// Parse time strings like "5 AM", "10:30 AM", "11 PM" into Date objects for a given day
function parseTime(timeStr: string, dateStr: string): string | null {
  try {
    const t = timeStr.trim()
    const match = t.match(/(\d+)(?::(\d+))? (AM|PM)/)
    if (!match) return null
    let h = parseInt(match[1])
    const m = parseInt(match[2] || '0')
    const ap = match[3]
    if (ap === 'PM' && h !== 12) h += 12
    if (ap === 'AM' && h === 12) h = 0
    return `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  if (person?.role_type !== 'admin') return NextResponse.json({ error: 'Board only' }, { status: 403 })

  const { day } = await req.json()
  if (!day || !['saturday', 'friday', 'thursday', 'sunday'].includes(day)) {
    return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
  }

  const contextKey = day === 'saturday' ? 'saturday_reference_schedule' : 'friday_reference_schedule'
  const dateStr = day === 'thursday' ? '2026-02-26'
    : day === 'friday' ? '2026-02-27'
    : day === 'saturday' ? '2026-02-28'
    : '2026-03-01'

  const { data: contextRows } = await service
    .from('schedule_context')
    .select('content')
    .eq('key', contextKey)
    .single()

  if (!contextRows?.content) {
    return NextResponse.json({ error: `No reference schedule found for ${day}` }, { status: 404 })
  }

  let schedule: {
    day: string
    notable_events: Record<string, string>
    people: Record<string, Array<{ time: string; task: string }>>
  }

  try {
    schedule = JSON.parse(contextRows.content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse reference schedule' }, { status: 500 })
  }

  const tasks: Array<{
    title: string
    description: string
    category: string
    status: string
    start_time: string | null
    end_time: string | null
  }> = []

  // Convert notable events
  for (const [time, event] of Object.entries(schedule.notable_events || {})) {
    const startTime = parseTime(time, dateStr)
    tasks.push({
      title: event,
      description: `Notable event at ${time}`,
      category: 'logistics',
      status: 'not_started',
      start_time: startTime,
      end_time: null,
    })
  }

  // Convert per-person schedules
  for (const [personName, entries] of Object.entries(schedule.people)) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const nextEntry = entries[i + 1]
      if (!entry.task || entry.task === '-') continue

      const startTime = parseTime(entry.time, dateStr)
      const endTime = nextEntry ? parseTime(nextEntry.time, dateStr) : null

      const category = inferCategory(entry.task)

      tasks.push({
        title: `[${personName}] ${entry.task.replace(/^"/, '').trim()}`,
        description: `${personName} — ${entry.time}: ${entry.task.replace(/^"/, '').trim()}`,
        category,
        status: 'not_started',
        start_time: startTime,
        end_time: endTime,
      })
    }
  }

  if (tasks.length === 0) {
    return NextResponse.json({ error: 'No tasks parsed from schedule' }, { status: 400 })
  }

  // Insert in batches of 100 to avoid payload limits
  const BATCH_SIZE = 100
  let totalInserted = 0

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE)
    const { data, error } = await service.from('tasks').insert(batch).select('*')
    if (error) {
      console.error('Batch insert error:', error)
      return NextResponse.json({
        error: error.message,
        inserted_so_far: totalInserted,
        failed_batch: i / BATCH_SIZE,
      }, { status: 500 })
    }
    totalInserted += data?.length || 0
  }

  return NextResponse.json({
    count: totalInserted,
    summary: `Imported ${totalInserted} tasks from the ${day} master schedule (${Object.keys(schedule.people).length} people).`,
  })
}
