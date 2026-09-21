# Launch copy — provider emails and support worker ads

Placeholders: {Site name} = working name "Supportwork" until the final name is
chosen. {Sender name}, {Business name}, {ABN}, {address} still needed from you.
Merge fields like {job title}, {suburb}, {applicant count} come from the database
at send time. Numbers are only ever real merge values — no template may ship with
an invented figure.

Confirmed inputs: 14-day free trial, $249 a month plus GST after, national launch,
$50/day combined ad budget.

Sequence: week 1 worker ads live; week 2 provider emails begin once applicants
exist, in batches of 100 per day.

---

## Deliverable 1 — Email A: provider already listed (link-out)

Subject lines to test (all under 45 characters):

1. Your support worker ad in {suburb}
2. Your {job title} ad is on {Site name}
3. About your job ad in {suburb}

Body (under 90 words):

> Hi {first name},
>
> Your {job title} role in {suburb} is listed on {Site name}, a job board only
> for support work in Australia. Right now we send readers to your original ad.
>
> Claim the listing free to receive applications directly and see applicant
> counts. After a 14-day free trial it is $249 a month plus GST for unlimited
> posts, cancel anytime.
>
> Claim your listing: {claim link}
>
> If you would rather the listing came down, reply "remove" and we will take it
> off within 5 business days.
>
> {Sender name}
> {Business name}, ABN {ABN}, {address}
> Unsubscribe: {unsubscribe link}

## Deliverable 2 — Email B: provider not listed

Subject lines to test (all under 45 characters):

1. A job board only for support work
2. Hiring support workers in {suburb}?
3. Unlimited support worker ads, one price

Body (under 90 words):

> Hi {first name},
>
> {Site name} is a job board only for support work: disability, aged care and
> home care. Nothing else, so your ad is not buried under unrelated jobs.
>
> Post unlimited jobs free for 14 days. After that it is $249 a month plus GST,
> cancel anytime. Card required to start.
>
> Applicants apply with a ready-made profile and CV, and you get an email for
> each one.
>
> Post a job free: {sign-up link}
>
> {Sender name}
> {Business name}, ABN {ABN}, {address}
> Unsubscribe: {unsubscribe link}

## Deliverable 3 — Follow-ups (5 days later, non-openers and non-clickers only)

Follow-up A (under 50 words — send only when {applicant count} is a real number):

> Hi {first name},
>
> Since we wrote, {applicant count} support workers have joined {Site name}
> looking for work near {suburb}. Your {job title} listing still links out, so
> none of them can apply to you directly.
>
> Claim your listing: {claim link}
>
> {footer as above}

Follow-up B (under 50 words — send only when {worker count} is a real number):

> Hi {first name},
>
> {worker count} support workers near {suburb} have joined {Site name} since
> launch. Posting is free for 14 days if you want to test it beside your
> current ads.
>
> Post a job free: {sign-up link}
>
> {footer as above}

No third email.

---

## Deliverable 4 — Support worker ads

### Meta (Facebook and Instagram, feed and stories) — 5 variations

Declare the campaign under Meta's employment Special Ad Category. That removes
age, gender and detailed-interest targeting and forces broad location radii, so
target: Australia (national), all adults, no interest stacking. Creative is plain
text on white or #212121, site name set in Inter; the only image beyond text is
an optional screenshot of the real job list.

1. Primary: "Support worker jobs near you. Disability, aged care and home care.
   No other industries to scroll past." (103)
   Headline: "Support work jobs near you" (26)
2. Primary: "Set up one profile, then apply to support work jobs in one click.
   Free for workers, always." (92)
   Headline: "Apply in one click" (18)
3. Primary: "Casual and flexible support work shifts across Australia. Enter
   your postcode to see what is close." (101)
   Headline: "Casual support work shifts" (26)
4. Primary: "Every job on {Site name} is support work: disability, aged care or
   home care. Nothing else." (91)
   Headline: "A job board just for support work" (33)
5. Primary: "New support work jobs by email, daily or weekly, matched to your
   suburb and work type." (87)
   Headline: "New jobs by email" (17)

### Google Search

Headlines (10, each 30 characters or fewer):

1. Support worker jobs (19)
2. Disability support jobs (23)
3. Aged care jobs near you (23)
4. Home care jobs (14)
5. Only support work jobs (22)
6. Apply in one click (18)
7. Casual support work shifts (26)
8. Free for support workers (24)
9. Jobs near your postcode (23)
10. New jobs by email (17)

Descriptions (4, each 90 characters or fewer):

1. A job board only for support work in Australia. Disability, aged care and
   home care. (84)
2. Enter your postcode to see support work jobs near you. Free to join and
   apply. (78)
3. Set up one profile and apply to support worker jobs in one click. Free for
   workers. (83)
4. Get new support work jobs by email, matched to your suburb and work type.
   (73)

Keyword themes: "support worker jobs {city}" for each capital city, "disability
support worker jobs", "aged care jobs near me", "home care jobs", "SIL jobs",
"casual support worker jobs". Phrase match to start; add negatives for "course",
"training", "certificate", "salary" queries.

### Landing pages

Ads land on the home job list pre-filtered to the viewer's state or city
(`/?state=WA` etc.), never a marketing page. The list is the pitch.

---

## Tracking

UTM scheme on every link:

- `utm_source`: `meta`, `google`, `email`
- `utm_medium`: `paid` or `email`
- `utm_campaign`: `launch-workers`, `launch-providers-listed`,
  `launch-providers-cold`
- `utm_content`: variant id (`meta-1` … `meta-5`, `ga-1` …, `email-a-subj2` …)

Weekly report: emails sent, opens, clicks, claims, trials started, paid
conversions; ad spend, clicks, sign-ups, completed profiles, applications per
live job. Targets: worker sign-up under $5; 2–5% of emailed providers start a
trial; trial providers receive 3+ applicants within 14 days.

## Compliance checklist (apply to every send and every ad)

- Spam Act: only published business addresses relevant to hiring; every email
  identifies {Business name}, ABN and contact details; working unsubscribe;
  removal requests honoured within 5 business days.
- Australian Consumer Law: no invented numbers, no implied relationship with
  Seek, Indeed, the NDIS or any provider; "NDIS" never appears in the brand.
- Price and trial stated accurately everywhere: card required, $249 a month plus
  GST after the 14-day trial, cancel anytime.
- No personal details of any individual advertiser are used in copy or targeting.

## Still needed from you

- Final site name and domain
- Sender name, business name, ABN and business address for email footers
- Meta Business Manager and Google Ads accounts (or access to create them)
