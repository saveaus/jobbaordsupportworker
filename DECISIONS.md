# Decisions log

Judgement calls made during the build, for review. Items marked **needs review**
change money, legal text or user-facing behaviour and should be confirmed before
launch.

## Confirmed by you

- Stack: Next.js + Supabase (Sydney region) + Stripe + Resend, hosted on Vercel Pro.
- Signed-out visitors see 10 jobs, then a sign-up panel. Enforced on the server:
  the query returns at most 10 rows plus a count. No signed-out pagination.
- Card required at provider sign-up for the 14-day trial.
- Imported listings and the claim flow are built (milestone 2).
- Providers lose access to an applicant's details 90 days after the job closes.
- Trial length for launch: 14 days (not 30).
- Launch marketing: national (all cities), $50/day combined ad budget.

## Chosen by the builder — needs review

- **GST: prices are quoted plus GST** ($249/month + $24.90 GST = $273.90 charged;
  $2,490/year + $249 GST). You were asked inclusive vs plus and the question was
  cancelled, so the B2B standard (exclusive) was chosen. Switching to
  GST-inclusive is one setting on the Stripe prices — say the word.
  GST is a manual 10% tax rate on the Stripe prices rather than Stripe Tax:
  one fixed-rate country, and it avoids Stripe Tax fees. Tax invoices show the
  business name and ABN.
- **Site name: "Supportwork" is a working placeholder.** It lives in one config
  constant used by the logo, favicon, page titles and email footers. Replace
  before launch.
- **Displayed times use Australia/Sydney** (AEST/AEDT). All storage is UTC. Most
  UI dates are relative ("Posted 3 days ago") so the zone rarely shows. If you
  prefer per-job local time, it is a small change.
- **Cancel goes through the Stripe customer portal**: Billing page → "Manage
  billing" → cancel. Counted as the brief's "two clicks from Billing"; safer
  than hand-rolling cancellation and card updates.

## Chosen by the builder — low risk

- Rate limiting uses a Postgres table (sliding window) instead of adding a Redis
  vendor. The brief says no new third-party services without asking. Adequate at
  this scale.
- Daily cron runs once at 6am AEST (`0 20 * * *` UTC). The 3-day payment grace
  period is therefore day-granular. The same run deletes `rate_limits` rows older
  than 24 hours and `stripe_events` older than 90 days.
- Next.js pinned at 16.3.5 — verified as the latest stable release against the
  official GitHub releases page and the npm `latest` tag on 21 Sep 2026.
- Admin accounts in production are created only by migration or the service
  role. No sign-up path can create one. The seed admin exists in staging only.
- Production Supabase project runs on the Pro plan — required for daily backups
  (cost implication: ~US$25/month).
- Import pipeline is adapter-based. CSV is the only adapter for now. The Adzuna
  API import you mentioned is deferred by your instruction ("we won't build that
  yet"); when built, it feeds the same de-duplication path, and Adzuna's
  attribution requirements are met by the existing "via {source_name}" line and
  link-outs.
- Webhook subscription state is always re-fetched from Stripe rather than read
  from the event payload; Stripe is the source of truth.
