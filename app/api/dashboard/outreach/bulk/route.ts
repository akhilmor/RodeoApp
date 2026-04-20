import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const TEMPLATES: Record<string, {
  subject: string
  html: (name: string, custom?: string) => string
}> = {
  reminder: {
    subject: 'Reminder: Raas Rodeo 2026 Ticket Payment',
    html: (name, custom) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Payment Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder that your Raas Rodeo 2026 ticket payment is still outstanding. Please complete your payment to secure your spot.</p>
        ${custom ? `<p>${custom}</p>` : ''}
        <p>If you have any questions, reply to this email.</p>
        <p style="color:#6b7280;font-size:14px">— Raas Rodeo 2026 Operations Team</p>
      </div>
    `,
  },
  confirmation: {
    subject: 'You\'re Confirmed for Raas Rodeo 2026!',
    html: (name, custom) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">You\'re In!</h2>
        <p>Hi ${name},</p>
        <p>Your registration for Raas Rodeo 2026 is confirmed. We can\'t wait to see you at the show!</p>
        ${custom ? `<p>${custom}</p>` : ''}
        <p style="color:#6b7280;font-size:14px">— Raas Rodeo 2026 Operations Team</p>
      </div>
    `,
  },
  fundraising: {
    subject: 'Support Raas Rodeo 2026',
    html: (name, custom) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Support Raas Rodeo 2026</h2>
        <p>Hi ${name},</p>
        <p>We\'d love your support for Raas Rodeo 2026! Your contribution helps us put on an incredible show for the South Asian dance community.</p>
        ${custom ? `<p>${custom}</p>` : ''}
        <p style="color:#6b7280;font-size:14px">— Raas Rodeo 2026 Operations Team</p>
      </div>
    `,
  },
  logistics: {
    subject: 'Raas Rodeo 2026 — Important Logistics Update',
    html: (name, custom) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Logistics Update</h2>
        <p>Hi ${name},</p>
        ${custom ? `<p>${custom}</p>` : '<p>Please see the latest logistics information for Raas Rodeo 2026.</p>'}
        <p style="color:#6b7280;font-size:14px">— Raas Rodeo 2026 Operations Team</p>
      </div>
    `,
  },
  custom: {
    subject: 'Message from Raas Rodeo 2026',
    html: (name, custom) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <p>Hi ${name},</p>
        ${custom ? `<p>${custom}</p>` : ''}
        <p style="color:#6b7280;font-size:14px">— Raas Rodeo 2026 Operations Team</p>
      </div>
    `,
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const {
    audience,    // 'all' | 'competitors' | 'liaisons' | 'board' | 'unpaid' | 'paid'
    type,        // template type
    subject_override,  // optional custom subject line
    custom_message,    // optional extra paragraph
    dry_run = false,   // if true, return recipients without sending
  } = body

  if (!audience || !type) {
    return NextResponse.json({ error: 'audience and type required' }, { status: 400 })
  }

  // Build recipient list from people + optional ticket join
  let recipients: { id: string | null; name: string; email: string }[] = []

  if (audience === 'unpaid' || audience === 'paid') {
    // Join tickets → people
    const ticketStatus = audience === 'paid' ? ['paid', 'picked_up'] : ['reserved', 'assigned']
    const { data: tickets } = await supabase
      .from('tickets')
      .select('people(id, first_name, last_name, email)')
      .in('status', ticketStatus)

    const seen = new Set<string>()
    for (const t of tickets || []) {
      const p = t.people as { id: string; first_name: string; last_name: string; email: string } | null
      if (p && p.email && !seen.has(p.email)) {
        seen.add(p.email)
        recipients.push({ id: p.id, name: `${p.first_name} ${p.last_name}`, email: p.email })
      }
    }
  } else {
    let query = supabase.from('people').select('id, first_name, last_name, email')
    if (audience === 'competitors') query = query.eq('role_type', 'competitor')
    else if (audience === 'liaisons') query = query.eq('role_type', 'liaison')
    else if (audience === 'board') query = query.eq('role_type', 'admin')
    // 'all' gets everyone

    const { data: people } = await query
    for (const p of people || []) {
      if (p.email && !p.email.endsWith('@raasrodeo2026.org')) {
        recipients.push({ id: p.id, name: `${p.first_name} ${p.last_name}`, email: p.email })
      }
    }
  }

  if (dry_run) {
    return NextResponse.json({ recipients, count: recipients.length })
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found for this audience' }, { status: 400 })
  }

  const template = TEMPLATES[type] || TEMPLATES.custom
  const subject = subject_override || template.subject

  let sent = 0
  let failed = 0
  const outreachRecords = []

  for (const r of recipients) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: r.email,
        subject,
        html: template.html(r.name, custom_message),
      })

      outreachRecords.push({
        person_id: r.id,
        name: r.name,
        email: r.email,
        type: ['fundraising', 'reminder', 'confirmation'].includes(type) ? type : 'reminder',
        status: 'sent',
        last_sent_at: new Date().toISOString(),
        notes: `Bulk campaign: ${audience} audience. ${custom_message ? 'Custom message included.' : ''}`,
      })
      sent++
    } catch {
      failed++
    }
  }

  if (outreachRecords.length > 0) {
    await supabase.from('outreach').insert(outreachRecords)
  }

  return NextResponse.json({ sent, failed, total: recipients.length })
}
