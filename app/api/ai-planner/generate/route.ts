import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are a logistics scheduling AI for Raas Rodeo 2026: A Night in Gotham — a competitive college Raas dance show.
Theme: A Night in Gotham. Show date: February 28, 2026. Venue: Dell Fine Arts Center, Austin TX.
You generate EXTREMELY DETAILED, minute-by-minute task schedules for every board member.

EVENT STRUCTURE:
- 8 competing teams: GT, WASHU, ILLINI, UVA, UCLA, UCSD, UTD, BU
- 4 operational days: Thursday (arrivals), Friday (setup + tech time), Saturday (show day), Sunday (departures)
- Board roles: Director (Tisha, Dedeepya, Akhil), Logistics Chair (Diya, Yadav), Hospitality Chair (Anirudh, Deepika), Tech Chair (Eshan), Show Chair (Anika), Social Chair (Ashrita, Tanisha), Finance Chair (Uma, Roshan), PR Chair (Avi, Tanisha), J&O Chair (Anjali, Savitha), Marketing Chair (Saanvika, Abhiram), Head Liaison (Akash), Freshman Reps (Pavitra, Meena, Netra, Akshitha, Sameeksha, Divya), volunteers (Arham, Srimaan, Simali, Vanisha, Sahithi, Prajith)
- Vehicle fleet: Mr.Freeze/Van1 (Saanvika), Joker/Van2 (Arham), Bane/Van3 (Srimaan), Riddler/Van4 (Diya), Alfred/UHaul1 (Yadav), Robin/UHaul2
- Key locations: Hilton Garden Inn (main hotel), WAMPUS (Deepika's apt, hospitality hub), Dell Performing Arts Center (show venue), TCC (mixer), WCP (dinner), SZB (PMP rooms), La Quinta (judges hotel)
- Show timeline: Doors 5:10PM, Show 6:00PM, Show ends ~10:15PM, AP starts 10:30PM

TASK CATEGORIES (use exactly these values):
- transport: van runs, airport pickups/dropoffs, driving
- logistics: general coordination, communication, non-transport ops
- food: food pickups, meal runs, snack prep
- show: show operations, stage, A/V, lighting, tech time, performance-related
- hotel: hotel logistics, check-in/out, room assignments, hospitality

SCHEDULE GRANULARITY REQUIREMENTS:
- Generate tasks for EVERY person for EVERY time slot, including 5-15 minute intervals
- Each task must have a specific start_time and end_time (ISO 8601 format)
- Show date: Saturday February 28, 2026. Thursday = Feb 26, Friday = Feb 27, Saturday = Feb 28, Sunday = March 1
- Include EXACTLY who does each task by name in the description (e.g. "Saanvika drives Mr.Freeze to hotel")
- Cover the entire day from wake-up through end-of-night for each person
- A full day schedule should produce 150-300+ individual tasks covering everyone

IMPORTANT: Always call get_schedule_context with key "saturday_reference_schedule" or "friday_reference_schedule" to get the exact per-person minute-by-minute master schedules. These are your ground truth — replicate them faithfully as tasks.

Your job: fetch people, teams, and the reference schedule context, then generate a comprehensive minute-by-minute set of tasks that exactly matches the master schedule. Use actual names, real times, and specific locations.`

const tools: Anthropic.Tool[] = [
  {
    name: 'get_people',
    description: 'Get board members, liaisons, volunteers',
    input_schema: { type: 'object' as const, properties: { role_type: { type: 'string' } } }
  },
  {
    name: 'get_teams',
    description: 'Get list of competing teams',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'get_schedule_context',
    description: 'Get context data. Keys: "saturday_reference_schedule" (full minute-by-minute per-person Saturday master schedule), "friday_reference_schedule" (full Friday master schedule), "van_fleet" (van assignments), "food_logistics", "venue_times", "team_travel_notes". Always fetch the reference schedule for the day you are generating.',
    input_schema: { type: 'object' as const, properties: { key: { type: 'string' } } }
  },
  {
    name: 'create_schedule',
    description: 'Output the final generated tasks to be added to the logistics board',
    input_schema: {
      type: 'object' as const,
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['transport', 'food', 'show', 'hotel', 'logistics'] },
              status: { type: 'string', enum: ['not_started', 'in_progress', 'done'] },
              start_time: { type: 'string', description: 'ISO 8601 datetime string, e.g. 2026-04-25T14:00:00' },
              end_time: { type: 'string', description: 'ISO 8601 datetime string' },
            },
            required: ['title', 'category', 'status']
          }
        },
        summary: { type: 'string' }
      },
      required: ['tasks', 'summary']
    }
  }
]

type TaskInput = {
  title: string
  description?: string
  category: 'transport' | 'food' | 'show' | 'hotel' | 'logistics'
  status: 'not_started' | 'in_progress' | 'done'
  start_time?: string
  end_time?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  if (person?.role_type !== 'admin') return NextResponse.json({ error: 'Board only' }, { status: 403 })

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 })

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt }
  ]

  let createdTasks: unknown[] = []
  let summary = ''

  try {
    let loop = true
    while (loop) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: SYSTEM,
        tools,
        tool_choice: { type: 'auto' },
        messages,
      })

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue
          const input = block.input as Record<string, unknown>
          let result = ''

          if (block.name === 'get_people') {
            let q = service.from('people').select('id, first_name, last_name, role_type, position')
            if (input.role_type) q = q.eq('role_type', input.role_type as string)
            const { data } = await q
            result = JSON.stringify(data || [])
          } else if (block.name === 'get_teams') {
            const { data } = await service.from('teams').select('id, name')
            result = JSON.stringify(data || [])
          } else if (block.name === 'get_schedule_context') {
            let q = service.from('schedule_context').select('*')
            if (input.key) q = q.eq('key', input.key as string)
            const { data } = await q
            result = JSON.stringify(data || [])
          } else if (block.name === 'create_schedule') {
            const taskInputs = (input.tasks as TaskInput[]) || []
            summary = (input.summary as string) || ''

            if (taskInputs.length > 0) {
              const { data: inserted, error: insertError } = await service
                .from('tasks')
                .insert(taskInputs.map(t => ({
                  title: t.title,
                  description: t.description || null,
                  category: t.category,
                  status: t.status,
                  start_time: t.start_time || null,
                  end_time: t.end_time || null,
                })))
                .select('*, people(id, first_name, last_name), teams(id, name)')

              if (insertError) {
                console.error('Task insert error:', insertError)
                result = JSON.stringify({ success: false, error: insertError.message })
              } else {
                createdTasks = inserted || []
              }
            }
            result = JSON.stringify({ success: true, inserted: taskInputs.length })
            loop = false
          }

          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }

        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults })
      } else {
        loop = false
      }
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  return NextResponse.json({ tasks: createdTasks, summary, count: createdTasks.length })
}
