-- Draft jobs can be written before a trial or paid plan. Pay to publish.

alter type job_status add value if not exists 'draft';

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
  v_can_publish boolean;
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

  v_can_publish := coalesce(
    v_provider.stripe_subscription_status in ('trialing', 'active')
    or (
      v_provider.stripe_subscription_status = 'past_due'
      and v_provider.grace_expires_at is not null
      and v_provider.grace_expires_at >= now()
    ),
    false
  );

  select p.lat, p.lng into v_lat, v_lng
  from postcodes p
  where p.postcode = p_postcode
  order by (lower(p.suburb) = lower(p_suburb)) desc
  limit 1;

  if not v_can_publish then
    v_status := 'draft';
  elsif v_provider.first_job_approved then
    v_status := 'live';
  else
    v_status := 'pending_approval';
  end if;

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

create or replace function publish_draft_job(p_job_id uuid)
returns jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider providers%rowtype;
  v_job jobs%rowtype;
  v_status job_status;
begin
  select p.* into v_provider
  from providers p
  join jobs j on j.provider_id = p.id
  where j.id = p_job_id
    and p.owner_user_id = (select auth.uid());

  if not found then
    raise exception 'not allowed';
  end if;
  if v_provider.stripe_subscription_status not in ('trialing', 'active')
    and not (
      v_provider.stripe_subscription_status = 'past_due'
      and v_provider.grace_expires_at is not null
      and v_provider.grace_expires_at >= now()
    )
  then
    raise exception 'subscription required';
  end if;

  if v_provider.first_job_approved then
    v_status := 'live';
  else
    v_status := 'pending_approval';
  end if;

  update jobs
  set status = v_status,
      published_at = case when v_status = 'live' then coalesce(published_at, now()) else published_at end,
      expires_at = case when v_status = 'live' then coalesce(expires_at, now() + interval '30 days') else expires_at end
  where id = p_job_id
    and status = 'draft'
  returning * into v_job;

  if not found then
    select * into v_job from jobs where id = p_job_id;
  end if;

  return v_job;
end;
$$;

grant execute on function create_job to authenticated;
grant execute on function publish_draft_job to authenticated;
