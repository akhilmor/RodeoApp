import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as const,
})

export const TICKET_PRICES: Record<string, number> = {
  competitor: parseInt(process.env.NEXT_PUBLIC_PRICE_COMPETITOR || '2500'),
  ff: parseInt(process.env.NEXT_PUBLIC_PRICE_FF || '3000'),
  public: parseInt(process.env.NEXT_PUBLIC_PRICE_PUBLIC || '3500'),
}

export const TICKET_LABELS: Record<string, string> = {
  competitor: 'Competitor Ticket',
  ff: 'Friends & Family Ticket',
  public: 'General Admission',
}
