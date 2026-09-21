# Supportwork

A job board only for support work in Australia (disability, aged care, home
care). Free for applicants. Providers pay $249 a month plus GST after a 14-day
trial.

Working site name: **Supportwork** (one constant in `src/config/site.ts`).

## Stack

Next.js 16.3.5, Supabase (Sydney), Stripe, Resend. Hosted on Vercel Pro.

## Local setup

1. Copy `.env.example` to `.env.local` and fill what you have. The app boots
   without keys; auth, billing and email no-op until they are set.
2. Create a Supabase project in the **Sydney** region. Run the files in
   `supabase/migrations/` in order against it (SQL editor or `supabase db push`).
3. `npm install`
4. `npm run seed` — postcodes, 30 sample jobs, 1 provider, 1 applicant, 1 admin
   (staging only).
5. `npx tsx scripts/stripe-setup.ts` — writes Stripe price and GST tax-rate IDs.
6. `npm run dev`

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm test` — Vitest (billing, import, claims, ABN, formats)
- `npm run e2e` — Playwright smoke tests
- `npm run seed`
- `npx tsx scripts/stripe-setup.ts`

## Daily cron

Vercel cron hits `GET /api/cron/daily` at 6am AEST (`0 20 * * *` UTC) with
`Authorization: Bearer $CRON_SECRET`. Same run: expiries, reminders, grace
unpublish, alerts, digests, 90-day access cutoff, housekeeping.

## Email DNS

See [docs/email-dns.md](docs/email-dns.md) for SPF, DKIM and DMARC on the
transactional (`mail.`) and alerts (`alerts.`) subdomains.

## Design

`/styleguide` lists every primitive. Palette, type and spacing are locked in
`src/app/globals.css`.

## Decisions

Judgement calls live in [DECISIONS.md](DECISIONS.md). Launch copy lives in
[marketing/launch-copy.md](marketing/launch-copy.md).
