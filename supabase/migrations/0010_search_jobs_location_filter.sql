-- Location search must hide jobs outside 50km, not only sort them.

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
set search_path = public
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
    v_offset := 0;
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
    and (
      p_lat is null
      or (
        j.lat is not null
        and j.lng is not null
        and haversine_km(p_lat, p_lng, j.lat, j.lng) <= 50
      )
    )
  order by
    case
      when p_lat is not null and j.lat is not null
        then haversine_km(p_lat, p_lng, j.lat, j.lng)
    end asc,
    j.published_at desc
  limit v_limit offset v_offset;
end;
$$;
