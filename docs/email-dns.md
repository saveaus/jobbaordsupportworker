# Email sending setup (Resend + Supabase custom SMTP)

Two sending subdomains keep alert volume away from transactional
reputation:

- `mail.{domain}` — transactional: auth links, application confirmations,
  provider notices, billing emails.
- `alerts.{domain}` — job alerts and daily digests.

## 1. Create both domains in Resend

Resend → Domains → Add domain, once for `mail.{domain}` and once for
`alerts.{domain}` (region: choose the closest supported region).

## 2. DNS records

Resend shows the exact values after each domain is added. You will add,
per subdomain:

| Type | Host | Value | Purpose |
| --- | --- | --- | --- |
| TXT | `send.mail.{domain}` | `v=spf1 include:amazonses.com ~all` (value shown by Resend) | SPF |
| MX | `send.mail.{domain}` | `feedback-smtp...amazonses.com` (shown by Resend) | Bounce handling |
| TXT | `resend._domainkey.mail.{domain}` | `p=...` (shown by Resend) | DKIM |
| TXT | `alerts` equivalents of all three | as shown by Resend | SPF/DKIM for alerts |

Add one DMARC record on the root domain (covers both subdomains):

| Type | Host | Value |
| --- | --- | --- |
| TXT | `_dmarc.{domain}` | `v=DMARC1; p=quarantine; rua=mailto:{CONTACT_EMAIL}; adkim=r; aspf=r` |

Start with `p=quarantine`; move to `p=reject` after two clean weeks of
reports.

## 3. Supabase Auth custom SMTP

Supabase dashboard → Project settings → Auth → SMTP:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- Sender email: `no-reply@mail.{domain}`
- Sender name: the site name

Also set Auth → URL configuration → Site URL to the deployed URL and add
`{site}/auth/callback` to the redirect allow-list.

## 4. App environment

- `EMAIL_FROM_TRANSACTIONAL="{Site name} <no-reply@mail.{domain}>"`
- `EMAIL_FROM_ALERTS="{Site name} <alerts@alerts.{domain}>"`

## 5. Google sign-in

Google Cloud Console → APIs & Services → Credentials → OAuth client ID
(web). Authorised redirect URI: `https://{supabase-project}.supabase.co/auth/v1/callback`.
Paste the client ID and secret into Supabase → Auth → Providers → Google.
