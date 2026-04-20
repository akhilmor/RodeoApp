import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const TEMPLATES: Record<string, { subject: string; html: (name: string) => string }> = {
  reminder: {
    subject: 'Reminder: Raas Rodeo Ticket Payment',
    html: (name) => `
      <h2>Payment Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder that your Raas Rodeo ticket payment is still outstanding.</p>
      <p>Please complete your payment as soon as possible to secure your spot.</p>
      <p>— Raas Rodeo Team</p>
    `,
  },
  confirmation: {
    subject: 'Raas Rodeo — You\'re Confirmed!',
    html: (name) => `
      <h2>See You at Raas Rodeo!</h2>
      <p>Hi ${name},</p>
      <p>Your registration is confirmed. We can't wait to see you at the show!</p>
      <p>— Raas Rodeo Team</p>
    `,
  },
  fundraising: {
    subject: 'Support Raas Rodeo',
    html: (name) => `
      <h2>Help Support Raas Rodeo</h2>
      <p>Hi ${name},</p>
      <p>We'd love your support for this year's Raas Rodeo event.</p>
      <p>Your contribution helps us put on an amazing show for the community.</p>
      <p>— Raas Rodeo Team</p>
    `,
  },
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: outreach, error } = await supabase
    .from('outreach')
    .select('*, people(first_name)')
    .eq('id', id)
    .single()

  if (error || !outreach) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const template = TEMPLATES[outreach.type]
  if (!template) return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  const name = outreach.people?.first_name || outreach.name || 'there'

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@raasrodeo.com',
    to: outreach.email,
    subject: template.subject,
    html: template.html(name),
  })

  const { data: updated } = await supabase
    .from('outreach')
    .update({ status: 'sent', last_sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json(updated)
}
