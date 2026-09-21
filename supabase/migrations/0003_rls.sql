-- Row Level Security. Access control lives here, not in the UI.
-- Tables with RLS enabled and no policies are service-role only.

alter table postcodes enable row level security;
alter table profiles enable row level security;
alter table providers enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table job_alerts enable row level security;
alter table reports enable row level security;
alter table claims enable row level security;
alter table import_runs enable row level security;
alter table blocked_provider_names enable row level security;
alter table email_suppressions enable row level security;
alter table email_log enable row level security;
alter table stripe_events enable row level security;
alter table rate_limits enable row level security;
alter table job_view_days enable row level security;
alter table admins enable row level security;

-- Postcodes are public reference data.
create policy postcodes_read on postcodes
  for select to anon, authenticated using (true);

-- Jobs: everyone reads live jobs; providers read their own in any status.
create policy jobs_read_live on jobs
  for select to anon, authenticated using (status = 'live');

create policy jobs_read_own on jobs
  for select to authenticated using (
    exists (
      select 1 from providers p
      where p.id = jobs.provider_id and p.owner_user_id = (select auth.uid())
    )
  );

-- No client insert/update policies on jobs: writes go through the
-- security-definer RPCs below (create_job, mark_job_filled, renew_job)
-- or the service role.

-- Profiles: applicants own their profile.
create policy profiles_own on profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Providers read an applicant's profile only when that applicant applied
-- to one of their jobs and the 90-day access window has not expired.
create policy profiles_read_by_applied_provider on profiles
  for select to authenticated using (
    exists (
      select 1
      from applications a
      join jobs j on j.id = a.job_id
      join providers p on p.id = j.provider_id
      where a.applicant_user_id = profiles.user_id
        and p.owner_user_id = (select auth.uid())
        and (a.access_expires_at is null or now() < a.access_expires_at)
    )
  );

-- Providers: owners see and manage their own record.
create policy providers_read_own on providers
  for select to authenticated using (owner_user_id = (select auth.uid()));

create policy providers_insert_own on providers
  for insert to authenticated with check (
    owner_user_id = (select auth.uid())
    and status = 'active'
    and first_job_approved = false
    and stripe_customer_id is null
    and stripe_subscription_id is null
  );

create policy providers_update_own on providers
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

-- Clients must not change moderation or billing columns.
create or replace function protect_provider_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.status is distinct from old.status
      or new.first_job_approved is distinct from old.first_job_approved
      or new.abn is distinct from old.abn
      or new.owner_user_id is distinct from old.owner_user_id
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.stripe_subscription_status is distinct from old.stripe_subscription_status
      or new.stripe_price_id is distinct from old.stripe_price_id
      or new.trial_end is distinct from old.trial_end
      or new.current_period_end is distinct from old.current_period_end
      or new.cancel_at_period_end is distinct from old.cancel_at_period_end
      or new.grace_expires_at is distinct from old.grace_expires_at
    then
      raise exception 'column is protected';
    end if;
  end if;
  return new;
end;
$$;
create trigger providers_protect_columns before update on providers
  for each row execute function protect_provider_columns();

-- Applications: applicants create and read their own; providers read and
-- move status for applications to their jobs while access lasts.
create policy applications_read_own on applications
  for select to authenticated using (applicant_user_id = (select auth.uid()));

create policy applications_insert_own on applications
  for insert to authenticated with check (
    applicant_user_id = (select auth.uid())
    and exists (
      select 1 from jobs j
      where j.id = job_id and j.status = 'live' and j.source = 'posted'
    )
    and exists (
      select 1 from profiles pr where pr.user_id = (select auth.uid())
    )
  );

create policy applications_read_by_provider on applications
  for select to authenticated using (
    exists (
      select 1 from jobs j
      join providers p on p.id = j.provider_id
      where j.id = applications.job_id and p.owner_user_id = (select auth.uid())
    )
    and (access_expires_at is null or now() < access_expires_at)
  );

create policy applications_update_by_provider on applications
  for update to authenticated
  using (
    exists (
      select 1 from jobs j
      join providers p on p.id = j.provider_id
      where j.id = applications.job_id and p.owner_user_id = (select auth.uid())
    )
    and (access_expires_at is null or now() < access_expires_at)
  );

-- Providers may only change application status and viewed_at.
create or replace function protect_application_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.job_id is distinct from old.job_id
      or new.applicant_user_id is distinct from old.applicant_user_id
      or new.message is distinct from old.message
      or new.access_expires_at is distinct from old.access_expires_at
      or new.created_at is distinct from old.created_at
    then
      raise exception 'column is protected';
    end if;
  end if;
  return new;
end;
$$;
create trigger applications_protect_columns before update on applications
  for each row execute function protect_application_columns();

-- Job alerts: owners only.
create policy job_alerts_own on job_alerts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Reports: signed-in users may lodge one per job; nobody reads them back.
create policy reports_insert on reports
  for insert to authenticated with check (reporter_user_id = (select auth.uid()));

-- Claims: claimants lodge and watch their own claims.
create policy claims_own_read on claims
  for select to authenticated using (claimant_user_id = (select auth.uid()));

create policy claims_insert_own on claims
  for insert to authenticated with check (
    claimant_user_id = (select auth.uid()) and status = 'pending' and auto_approved = false
  );

------------------------------------------------------------------
-- RPCs
------------------------------------------------------------------

-- Job search. The 10-row cap and no-pagination rule for signed-out
-- visitors is enforced here, in the database.
create or replace function search_jobs(
  p_keyword text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_state au_state default null,
  p_work_type work_type default null,
  p_role_category role_category default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  provider_name text,
  provider_logo_path text,
  suburb text,
  state au_state,
  work_type work_type,
  pay_min numeric,
  pay_max numeric,
  pay_period pay_period,
  source job_source,
  source_name text,
  published_at timestamptz,
  distance_km double precision,
  total_count bigint
)
language plpgsql
stable
security invoker
as $$
declare
  v_signed_in boolean := (select auth.uid()) is not null;
  v_limit int;
  v_offset int;
begin
  if v_signed_in then
    v_limit := least(greatest(coalesce(p_limit, 20), 1), 50);
    v_offset := greatest(coalesce(p_offset, 0), 0);
  else
    v_limit := least(greatest(coalesce(p_limit, 10), 1), 10);
    v_offset := 0; -- signed-out visitors cannot paginate
  end if;

  return query
  select
    j.id, j.slug, j.title, j.provider_name, j.provider_logo_path,
    j.suburb, j.state, j.work_type, j.pay_min, j.pay_max, j.pay_period,
    j.source, j.source_name, j.published_at,
    case when p_lat is not null and j.lat is not null
      then haversine_km(p_lat, p_lng, j.lat, j.lng) end as distance_km,
    count(*) over () as total_count
  from jobs j
  where j.status = 'live'
    and (p_state is null or j.state = p_state)
    and (p_work_type is null or j.work_type = p_work_type)
    and (p_role_category is null or j.role_category = p_role_category)
    and (
      p_keyword is null or p_keyword = ''
      or j.title ilike '%' || p_keyword || '%'
      or j.provider_name ilike '%' || p_keyword || '%'
      or j.description ilike '%' || p_keyword || '%'
    )
  order by
    -- With a location: within 50km nearest first, then newest.
    case
      when p_lat is not null and j.lat is not null
        and haversine_km(p_lat, p_lng, j.lat, j.lng) <= 50 then 0
      else 1
    end,
    case
      when p_lat is not null and j.lat is not null
        and haversine_km(p_lat, p_lng, j.lat, j.lng) <= 50
        then haversine_km(p_lat, p_lng, j.lat, j.lng)
    end asc,
    j.published_at desc
  limit v_limit offset v_offset;
end;
$$;

-- Sliding-window rate limit. Records the hit and reports whether the
-- caller is within the window. Callable by anon (sign-up, magic link).
create or replace function check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into rate_limits (key) values (p_key);
  select count(*) into v_count
  from rate_limits
  where key = p_key
    and created_at > now() - make_interval(secs => p_window_seconds);
  return v_count <= p_max;
end;
$$;

-- Create a job for the signed-in provider. Enforces attestation,
-- account standing, billing standing and the first-job approval hold.
create or replace function create_job(
  p_title text,
  p_role_category role_category,
  p_suburb text,
  p_state au_state,
  p_postcode text,
  p_work_type work_type,
  p_pay_min numeric,
  p_pay_max numeric,
  p_pay_period pay_period,
  p_requirements requirement[],
  p_description text,
  p_positions int
)
returns jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider providers%rowtype;
  v_job jobs%rowtype;
  v_status job_status;
  v_lat double precision;
  v_lng double precision;
  v_slug text;
begin
  select * into v_provider
  from providers
  where owner_user_id = (select auth.uid());

  if not found then
    raise exception 'no provider account';
  end if;
  if v_provider.status <> 'active' then
    raise exception 'account suspended';
  end if;
  if not v_provider.is_employer_attested then
    raise exception 'employer attestation required';
  end if;
  if v_provider.stripe_subscription_status is null
    or v_provider.stripe_subscription_status not in ('trialing', 'active', 'past_due')
    or (v_provider.stripe_subscription_status = 'past_due'
        and v_provider.grace_expires_at is not null
        and now() > v_provider.grace_expires_at)
  then
    raise exception 'subscription required';
  end if;

  select p.lat, p.lng into v_lat, v_lng
  from postcodes p
  where p.postcode = p_postcode
  order by (lower(p.suburb) = lower(p_suburb)) desc
  limit 1;

  v_status := case when v_provider.first_job_approved then 'live'::job_status
                   else 'pending_approval'::job_status end;

  v_slug := trim(both '-' from regexp_replace(lower(p_title), '[^a-z0-9]+', '-', 'g'))
            || '-' || substr(gen_random_uuid()::text, 1, 8);

  insert into jobs (
    provider_id, provider_name, provider_logo_path, slug, title,
    role_category, suburb, state, postcode, lat, lng, work_type,
    pay_min, pay_max, pay_period, requirements, description, positions,
    status, source, published_at, expires_at
  ) values (
    v_provider.id, v_provider.business_name, v_provider.logo_path, v_slug, p_title,
    p_role_category, p_suburb, p_state, p_postcode, v_lat, v_lng, p_work_type,
    p_pay_min, p_pay_max, p_pay_period, coalesce(p_requirements, '{}'), p_description,
    coalesce(p_positions, 1),
    v_status, 'posted',
    case when v_status = 'live' then now() end,
    case when v_status = 'live' then now() + interval '30 days' end
  )
  returning * into v_job;

  return v_job;
end;
$$;

-- Provider marks a job filled.
create or replace function mark_job_filled(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update jobs j
  set status = 'filled', filled_at = now()
  from providers p
  where j.id = p_job_id
    and p.id = j.provider_id
    and p.owner_user_id = (select auth.uid())
    and j.status in ('live', 'pending_approval', 'unpublished');
  if not found then
    raise exception 'not allowed';
  end if;
end;
$$;

-- Provider renews a job for 30 days (from the expiring email or dashboard).
create or replace function renew_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider providers%rowtype;
begin
  select p.* into v_provider
  from providers p
  join jobs j on j.provider_id = p.id
  where j.id = p_job_id and p.owner_user_id = (select auth.uid());

  if not found then
    raise exception 'not allowed';
  end if;
  if v_provider.stripe_subscription_status is null
    or v_provider.stripe_subscription_status not in ('trialing', 'active')
  then
    raise exception 'subscription required';
  end if;

  update jobs
  set status = 'live',
      expires_at = now() + interval '30 days',
      closed_at = null,
      published_at = coalesce(published_at, now())
  where id = p_job_id and status in ('live', 'expired');
end;
$$;

-- Daily view counting, called by the server only.
create or replace function increment_job_views(p_job_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into job_view_days (job_id, day, views)
  values (p_job_id, (now() at time zone 'Australia/Sydney')::date, 1)
  on conflict (job_id, day) do update set views = job_view_days.views + 1;
$$;

-- Function grants: RPCs meant for clients are executable by anon or
-- authenticated; everything else is service-role only.
revoke execute on all functions in schema public from anon, authenticated;
grant execute on function search_jobs to anon, authenticated;
grant execute on function check_rate_limit to anon, authenticated;
grant execute on function create_job to authenticated;
grant execute on function mark_job_filled to authenticated;
grant execute on function renew_job to authenticated;
grant execute on function haversine_km to anon, authenticated;
