export type RoleType = 'admin' | 'liaison' | 'captain' | 'audience' | 'volunteer'

export type Position =
  | 'Director'
  | 'Finance Chair'
  | 'Hospitality Chair'
  | 'Logistics Chair'
  | 'Show Chair'
  | 'Social Chair'
  | 'Public Relations Chair'
  | 'Tech Chair'
  | 'Marketing Chair'
  | 'J&O Chair'
  | 'Head Liaison'
  | 'Freshman Rep'
  | 'Liaison'
  | 'Captain'
  | 'Audience'
  | 'Volunteer'

export type TicketType = 'competitor' | 'ff' | 'public'
export type TicketStatus = 'reserved' | 'assigned' | 'paid' | 'checked_in'

export type PaymentMethod = 'stripe' | 'venmo' | 'zelle' | 'team'
export type PaymentStatus = 'pending' | 'confirmed'

export type TaskCategory = 'transport' | 'food' | 'show' | 'hotel' | 'logistics'
export type TaskStatus = 'not_started' | 'in_progress' | 'done'

export type OutreachType = 'fundraising' | 'reminder' | 'confirmation'
export type OutreachStatus = 'not_sent' | 'sent' | 'responded'

export interface Team {
  id: string
  name: string
  ticket_allocation: number
  notes: string | null
}

export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  venmo_handle: string | null
  role_type: RoleType
  position: Position
  team_id: string | null
  notes: string | null
  created_at: string
  teams?: Team
}

export interface Ticket {
  id: string
  person_id: string
  type: TicketType
  status: TicketStatus
  assigned_at: string | null
  qr_token: string | null
  scanned_at: string | null
  people?: Person
}

export interface Payment {
  id: string
  person_id: string | null
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  external_reference: string | null
  notes: string | null
  created_at: string
  people?: Person
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  team_id: string | null
  location: string | null
  start_time: string | null
  end_time: string | null
  category: TaskCategory
  status: TaskStatus
  people?: Person
  teams?: Team
}

export interface Outreach {
  id: string
  person_id: string | null
  name: string | null
  email: string
  type: OutreachType
  status: OutreachStatus
  last_sent_at: string | null
  notes: string | null
  people?: Person
}
