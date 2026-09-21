-- Extensions, enums and shared helper functions.

create extension if not exists pgcrypto;

-- Fixed lists from the brief. Labels are mapped in the app.
create type work_type as enum ('casual', 'part_time', 'full_time', 'contract');

create type role_category as enum (
  'disability_support',
  'aged_care',
  'home_care',
  'mental_health_support',
  'sil',
  'other'
);

create type requirement as enum (
  'drivers_licence',
  'own_vehicle',
  'ndis_screening',
  'wwcc',
  'first_aid',
  'qualification'
);

create type job_status as enum (
  'pending_approval',
  'live',
  'filled',
  'expired',
  'unpublished',
  'hidden',
  'removed'
);

create type job_source as enum ('posted', 'imported');
create type pay_period as enum ('hour', 'year');
create type application_status as enum ('sent', 'viewed', 'shortlisted', 'not_suitable');
create type provider_status as enum ('active', 'suspended');
create type alert_frequency as enum ('daily', 'weekly');
create type claim_status as enum ('pending', 'approved', 'rejected');

create type au_state as enum ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT');

-- updated_at maintenance
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Great-circle distance in km. Sufficient for 50km job ordering.
create or replace function haversine_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 2 * 6371 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lng2 - lng1) / 2), 2)
    )
  );
$$;
