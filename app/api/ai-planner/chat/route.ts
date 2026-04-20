import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const BASE_EVENT_CONTEXT = `
You are the AI logistics assistant for Raas Rodeo 2026 — a competitive college Raas dance show.
You have deep knowledge of the event's structure and help the board plan, schedule, and coordinate every aspect.

== EVENT OVERVIEW ==
Raas Rodeo is a competitive Raas (Gujarati folk dance) show hosted by a board organization.
8 competing teams travel from different universities. The show runs one full day (Saturday), with 4 days of operations (Thursday–Sunday).

== COMPETING TEAMS & UNIVERSITIES ==
- GT (Georgia Tech) — Atlanta, GA (local/driving)
- WASHU (Washington University St. Louis)
- ILLINI (University of Illinois Urbana-Champaign)
- UVA (University of Virginia)
- UCLA (University of California Los Angeles)
- UCSD (University of California San Diego)
- UTD (University of Texas Dallas)
- BU (Boston University)

== BOARD ROLES ==
The board has specialized roles that inform assignment logic:
- Logistics Chair: coordinates all transportation and task assignments (main planner)
- Hospitality Chair: manages team accommodations, food, hotel logistics
- Tech Chair: runs tech time pipeline and A/V setup
- Sponsorship Chair: handles sponsors
- Treasurer: financial tracking
- Secretary: documentation
- Social Chair: social media, photographer coordination
- Cultural Chair: cultural program elements
- PR Chair: external communications
- General Members: flexible support roles

== OPERATIONS STRUCTURE ==
Thursday: Airport runs — teams arrive throughout the day, each needs pickup from airport or car drop arrangements
Friday: Setup day — venue setup, tech time pipeline (all 8 teams rotate through venue for sound check + practice on stage)
Saturday: Show day — doors open, competition, food service, judging, awards
Sunday: Teardown + airport dropoffs

== TECH TIME PIPELINE (Friday) ==
Each team gets a fixed block at the venue to practice on stage with full tech (lights, sound).
Teams rotate through in a set order. Each slot is roughly 45–60 min.
The Tech Chair runs the board, sound engineer manages the board.
At least 2–3 board members needed at venue for each slot.

== FOOD LOGISTICS ==
Food pickups happen across multiple days:
- Snacks/welcome bags: picked up Thursday/Friday
- Meals: catered or picked up from restaurants, must arrive hot at specific times
- Show day concessions: separate logistics from team/judge meals
- Board meals: coordinated separately

== VEHICLES ==
Fleet: multiple 15-passenger vans + UHaul trucks (for equipment)
Each vehicle needs a designated driver (board member with van driving experience).
Pickup routes must be planned around flight arrival times.

== KEY CONSTRAINTS FOR SCHEDULING ==
Hard constraints (non-negotiable):
1. Flight arrival/departure windows — team members can't be assigned before they land or after they leave
2. Venue booking windows — can't use venue outside booked time
3. Van driver availability — only designated drivers can drive vans
4. Food pickup deadlines — food must arrive by meal times

Soft constraints (optimize for):
1. Board member workload balance — avoid burning out individual members
2. Role specialization — assign people to tasks that match their expertise
3. Travel efficiency — group pickups for nearby flight arrivals
4. Buffer time — builds in 15–30 min buffers around hard deadlines

== YOUR CAPABILITIES ==
You can help the board:
1. Generate full schedules for any day (Thu/Fri/Sat/Sun) or the entire weekend
2. Assign board members to specific tasks given their availability
3. Plan van routes for airport pickups given flight arrival times
4. Coordinate food pickup chains
5. Build the tech time pipeline order and board assignments
6. Check for conflicts and suggest fixes
7. Answer any question about event logistics
8. Refine drafts iteratively — the board can say "move X to earlier" or "swap A and B" and you'll update

When generating schedules, output structured JSON blocks alongside readable explanations.
When there's not enough info, ask targeted questions to fill gaps rather than making things up.
`.trim()

const tools: Anthropic.Tool[] = [
  {
    name: 'get_people',
    description: 'Get list of board members, liaisons, and volunteers with their roles',
    input_schema: {
      type: 'object' as const,
      properties: {
        role_type: {
          type: 'string',
          description: 'Filter by role: admin, liaison, volunteer, captain, or omit for all'
        }
      }
    }
  },
  {
    name: 'get_teams',
    description: 'Get list of all competing teams',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'get_team_travel',
    description: 'Get travel itinerary data for teams (flights, arrival/departure times)',
    input_schema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string', description: 'Filter by team UUID (optional)' }
      }
    }
  },
  {
    name: 'get_person_availability',
    description: 'Get unavailability/conflict windows for board members',
    input_schema: {
      type: 'object' as const,
      properties: {
        person_id: { type: 'string', description: 'Filter by person UUID (optional)' }
      }
    }
  },
  {
    name: 'get_schedule_context',
    description: 'Get free-form context data: food logistics, venue times, van assignments, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Specific context key to fetch (optional, omit for all)' }
      }
    }
  },
  {
    name: 'get_tasks',
    description: 'Get existing logistics tasks from the task board',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'Filter by category (optional)' },
        status: { type: 'string', description: 'Filter by status: pending, in_progress, done (optional)' }
      }
    }
  },
  {
    name: 'save_schedule',
    description: 'Save a generated schedule as a named draft for the board to reference',
    input_schema: {
      type: 'object' as const,
      properties: {
        label: { type: 'string', description: 'Name for this schedule draft' },
        content: { type: 'object', description: 'Structured schedule JSON' },
        prompt_used: { type: 'string', description: 'The user request that triggered this generation' }
      },
      required: ['label', 'content']
    }
  },
  {
    name: 'upsert_context',
    description: 'Save or update a context data blob (e.g. food logistics, van routes, venue times)',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Unique key for this context (e.g. food_logistics)' },
        label: { type: 'string', description: 'Human-readable label' },
        content: { type: 'string', description: 'The context data as text or JSON string' }
      },
      required: ['key', 'label', 'content']
    }
  }
]

async function executeTool(name: string, input: Record<string, unknown>, supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  try {
    switch (name) {
      case 'get_people': {
        let q = supabase.from('people').select('id, first_name, last_name, email, role_type, team_id')
        if (input.role_type) q = q.eq('role_type', input.role_type as string)
        const { data } = await q
        return JSON.stringify(data || [])
      }
      case 'get_teams': {
        const { data } = await supabase.from('teams').select('id, name')
        return JSON.stringify(data || [])
      }
      case 'get_team_travel': {
        let q = supabase.from('team_travel').select('*, teams(name), people(first_name, last_name)')
          .order('arrives_at', { ascending: true })
        if (input.team_id) q = q.eq('team_id', input.team_id as string)
        const { data } = await q
        return JSON.stringify(data || [])
      }
      case 'get_person_availability': {
        let q = supabase.from('person_availability').select('*, people(first_name, last_name)')
          .order('starts_at', { ascending: true })
        if (input.person_id) q = q.eq('person_id', input.person_id as string)
        const { data } = await q
        return JSON.stringify(data || [])
      }
      case 'get_schedule_context': {
        let q = supabase.from('schedule_context').select('*')
        if (input.key) q = q.eq('key', input.key as string)
        const { data } = await q
        return JSON.stringify(data || [])
      }
      case 'get_tasks': {
        let q = supabase.from('tasks').select('*').order('start_time', { ascending: true })
        if (input.category) q = q.eq('category', input.category as string)
        if (input.status) q = q.eq('status', input.status as string)
        const { data } = await q
        return JSON.stringify(data || [])
      }
      case 'save_schedule': {
        const { data } = await supabase.from('generated_schedules').insert({
          label: input.label,
          content: input.content,
          prompt_used: input.prompt_used || null,
        }).select('id, label, created_at').single()
        return JSON.stringify(data || { success: true })
      }
      case 'upsert_context': {
        const { data } = await supabase.from('schedule_context').upsert({
          key: input.key,
          label: input.label,
          content: input.content,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' }).select('id, key').single()
        return JSON.stringify(data || { success: true })
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (e) {
    return JSON.stringify({ error: String(e) })
  }
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  if (person?.role_type !== 'admin') return NextResponse.json({ error: 'Board only' }, { status: 403 })

  const { messages }: { messages: ChatMessage[] } = await req.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text))

      try {
        const apiMessages: Anthropic.MessageParam[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }))

        let continueLoop = true
        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8096,
            system: BASE_EVENT_CONTEXT,
            tools,
            messages: apiMessages,
          })

          for (const block of response.content) {
            if (block.type === 'text') {
              send(block.text)
            } else if (block.type === 'tool_use') {
              send(`\n\n*[Fetching ${block.name}...]*\n\n`)
            }
          }

          if (response.stop_reason === 'tool_use') {
            const toolResults: Anthropic.ToolResultBlockParam[] = []
            for (const block of response.content) {
              if (block.type === 'tool_use') {
                const result = await executeTool(block.name, block.input as Record<string, unknown>, service)
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: result,
                })
              }
            }
            apiMessages.push({ role: 'assistant', content: response.content })
            apiMessages.push({ role: 'user', content: toolResults })
          } else {
            continueLoop = false
          }
        }
      } catch (e) {
        send(`\n\n**Error:** ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
