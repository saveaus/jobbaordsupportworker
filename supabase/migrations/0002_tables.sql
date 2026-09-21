-- Core tables. All timestamps are UTC (timestamptz); display is Australian time.

-- Public Australian postcode/suburb dataset with coordinates.
create table postcodes (
  id serial primary key,
  postcode text not null,
  suburb text not null,
  state au_state not null,
  lat double precision not null,
  lng double precision not null
);
create index postcodes_postcode_idx on postcodes (postcode);
create index postcodes_suburb_idx on postcodes (lower(suburb));

-- Applicant profile. One page; name, email, postcode required.
create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  postcode text not null,
  suburb text,
  state au_state,
  lat double precision,
  lng double precision,
  work_types work_type[] not null default '{}',
  requirements requirement[] not null default '{}',
  about text check (char_length(about) <= 500),
  cv_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Providers. Rows exist both for signed-up providers (owner_user_id set)
-- and for account-less provider records created by imports.
create table providers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid unique references auth.users (id) on delete set null,
  business_name text not null,
  normalised_name text not null,
  abn char(11) unique check (abn ~ '^[0-9]{11}$'),
  contact_name text,
  email text,
  phone text,
  website_domain text,
  logo_path text,
  is_employer_attested boolean not null default false,
  status provider_status not null default 'active',
  first_job_approved boolean not null default false,
  -- Billing (Stripe is the source of truth; this is the saved copy)
  stripe_customer_id text unique,
  stripe_subscription_id text,
  stripe_subscription_status text,
  stripe_price_id text,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grace_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index providers_normalised_name_idx on providers (normalised_name);
create trigger providers_updated_at before update on providers
  for each row execute function set_updated_at();

create table jobs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  -- Denormalised so public pages never join the providers table.
  provider_name text not null,
  provider_logo_path text,
  slug text unique not null,
  title text not null,
  role_category role_category not null,
  suburb text not null,
  state au_state not null,
  postcode text not null,
  lat double precision,
  lng double precision,
  work_type work_type not null,
  pay_min numeric check (pay_min >= 0),
  pay_max numeric check (pay_max >= 0),
  pay_period pay_period,
  requirements requirement[] not null default '{}',
  description text not null default '',
  positions int not null default 1 check (positions >= 1),
  status job_status not null default 'pending_approval',
  source job_source not null default 'posted',
  source_url text,
  source_name text,
  import_key text,
  missing_import_runs int not null default 0,
  published_at timestamptz,
  expires_at timestamptz,
  unpublished_at timestamptz,
  filled_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_status_published_idx on jobs (status, published_at desc);
create index jobs_provider_idx on jobs (provider_id);
create unique index jobs_source_url_idx on jobs (source_url) where source_url is not null;
create index jobs_import_key_idx on jobs (import_key) where import_key is not null;
create trigger jobs_updated_at before update on jobs
  for each row execute function set_updated_at();

-- When a job closes (filled or expired), start the 90-day access window
-- on its applications. Billing unpublish does not close a job.
create or replace function on_job_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('filled', 'expired') and old.status not in ('filled', 'expired') then
    new.closed_at = now();
    update applications
      set access_expires_at = now() + interval '90 days'
      where job_id = new.id and access_expires_at is null;
  end if;
  return new;
end;
$$;
create trigger jobs_on_closed before update on jobs
  for each row execute function on_job_closed();

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  applicant_user_id uuid not null references auth.users (id) on delete cascade,
  message text check (char_length(message) <= 500),
  status application_status not null default 'sent',
  viewed_at timestamptz,
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, applicant_user_id)
);
create index applications_job_idx on applications (job_id);
create index applications_applicant_idx on applications (applicant_user_id);

create table job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  postcode text not null,
  lat double precision,
  lng double precision,
  radius_km int not null default 50,
  work_types work_type[] not null default '{}',
  frequency alert_frequency not null default 'daily',
  active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index job_alerts_user_idx on job_alerts (user_id);

create table reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (job_id, reporter_user_id)
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  imported_provider_id uuid not null references providers (id) on delete cascade,
  claimant_user_id uuid not null references auth.users (id) on delete cascade,
  claimant_provider_id uuid references providers (id) on delete set null,
  claimant_email text not null,
  status claim_status not null default 'pending',
  auto_approved boolean not null default false,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index claims_status_idx on claims (status);

create table import_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  filename text,
  row_count int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  expired_count int not null default 0,
  created_at timestamptz not null default now()
);

create table blocked_provider_names (
  id uuid primary key default gen_random_uuid(),
  normalised_name text unique not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Unsubscribed addresses. Essential auth email is never suppressed.
create table email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Idempotent sending: one email per recipient/template/related id/AEST day.
create table email_log (
  id bigint generated always as identity primary key,
  recipient text not null,
  template text not null,
  related_id text not null default '',
  sent_at timestamptz not null default now(),
  sent_date date not null default ((now() at time zone 'Australia/Sydney')::date),
  unique (recipient, template, related_id, sent_date)
);

-- Processed Stripe webhook events (idempotency).
create table stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

-- Sliding-window rate limiting; rows older than 24h are deleted by cron.
create table rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limits_key_idx on rate_limits (key, created_at);

-- Daily view totals per job. No per-view rows.
create table job_view_days (
  job_id uuid not null references jobs (id) on delete cascade,
  day date not null,
  views int not null default 0,
  primary key (job_id, day)
);

-- Admin flag: presence of a row makes a user an admin. Written only by
-- migrations or the service role. No RLS policies expose it to clients.
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
