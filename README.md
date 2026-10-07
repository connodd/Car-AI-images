# REVFRAME

Premium AI automotive studio for professional photoshoots, realistic rollers, and precise wheel visualizations.

## Production stack

Next.js 16 + TypeScript, Supabase Auth/Postgres/Storage, Gemini image generation, Stripe Checkout/Billing, Vercel Analytics, and Vercel deployment.

## Setup

1. Create a Supabase project and run `migrations/001_initial.sql`.
2. Copy `.env.example` to `.env.local` and supply the required secrets.
3. Configure the Stripe webhook endpoint at `/api/stripe/webhook`.
4. Run `npm install`, `npm run lint`, `npm run typecheck`, and `npm run build`.

All uploaded and generated images are stored in private buckets and exposed through short-lived signed URLs.
