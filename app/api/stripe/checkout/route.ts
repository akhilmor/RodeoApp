import { NextRequest, NextResponse } from 'next/server'
import { stripe, TICKET_PRICES, TICKET_LABELS } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  ticket_type: z.enum(['competitor', 'ff', 'public']),
  quantity: z.number().int().min(1).max(10).default(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const unitAmount = TICKET_PRICES[data.ticket_type]

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: TICKET_LABELS[data.ticket_type],
              description: 'Raas Rodeo 2025',
            },
          },
          quantity: data.quantity,
        },
      ],
      customer_email: data.email,
      metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        ticket_type: data.ticket_type,
        quantity: String(data.quantity),
      },
      success_url: `${appUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/tickets`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
