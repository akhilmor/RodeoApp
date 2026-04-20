import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FUNDRAISING_EMAIL = (name: string, custom?: string) => `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a">
  <h2 style="color:#4f46e5;margin-bottom:8px">Raas Rodeo 2026 — Sponsorship Opportunity</h2>
  <p style="color:#6b7280;font-size:14px;margin-top:0">April 25–26, 2026 · Austin, Texas</p>

  <p>Dear ${name},</p>

  <p>My name is Akhil, and I'm reaching out on behalf of <strong>Raas Rodeo 2026</strong> — a premier competitive college Raas dance showcase hosted in Austin, bringing together 8 top South Asian college dance teams from across the country.</p>

  <p>This event draws hundreds of attendees from the Austin-area South Asian community and beyond. We're looking for local businesses and organizations who'd like to support the next generation of South Asian cultural performers.</p>

  <p><strong>Why sponsor Raas Rodeo?</strong></p>
  <ul style="padding-left:20px">
    <li>Reach a highly engaged South Asian audience (500+ attendees)</li>
    <li>Logo placement on event materials, programs, and social media</li>
    <li>Recognition at the show and on our website</li>
    <li>Direct connection to the Austin South Asian community</li>
  </ul>

  ${custom ? `<p>${custom}</p>` : ''}

  <p>Sponsorship tiers start at $250. We'd love to have you as a partner. If you're interested or have questions, simply reply to this email.</p>

  <p>Thank you for your time and for supporting our community.</p>

  <p>Warm regards,<br>
  <strong>Akhil Morusupalli</strong><br>
  Raas Rodeo 2026 — Operations<br>
  <span style="color:#6b7280;font-size:13px">raasrodeo2026.org</span></p>
</div>
`

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const { prospect_ids, custom_message, subject_override, send_to_all_with_email } = await req.json()

  let prospects: { id: string; business_name: string; contact_name: string | null; email: string | null }[] = []

  if (send_to_all_with_email) {
    const { data } = await supabase
      .from('prospects')
      .select('id, business_name, contact_name, email')
      .not('email', 'is', null)
      .eq('status', 'new')
    prospects = data || []
  } else if (prospect_ids?.length) {
    const { data } = await supabase
      .from('prospects')
      .select('id, business_name, contact_name, email')
      .in('id', prospect_ids)
    prospects = data || []
  }

  const withEmail = prospects.filter(p => p.email)
  if (withEmail.length === 0) {
    return NextResponse.json({ error: 'No prospects with emails found' }, { status: 400 })
  }

  let sent = 0
  let failed = 0

  for (const p of withEmail) {
    try {
      const recipientName = p.contact_name || p.business_name

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: p.email!,
        subject: subject_override || 'Sponsorship Opportunity — Raas Rodeo 2026 (Austin)',
        html: FUNDRAISING_EMAIL(recipientName, custom_message),
      })

      await supabase
        .from('prospects')
        .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
        .eq('id', p.id)

      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: withEmail.length })
}
