-- Table grants so the Data API can reach RLS-protected tables.
-- Tables with no grant remain service-role only.

grant usage on schema public to anon, authenticated;

grant select on table postcodes to anon, authenticated;
grant select on table jobs to anon, authenticated;

grant select, insert, update, delete on table profiles to authenticated;
grant select, insert, update on table providers to authenticated;
grant select, insert, update on table applications to authenticated;
grant select, insert, update, delete on table job_alerts to authenticated;
grant insert on table reports to authenticated;
grant select, insert on table claims to authenticated;
grant select on table job_view_days to authenticated;

grant execute on function increment_job_views(uuid) to anon, authenticated;

-- Providers may read daily view totals for their own jobs.
create policy job_view_days_read_own on job_view_days
  for select to authenticated using (
    exists (
      select 1 from jobs j
      join providers p on p.id = j.provider_id
      where j.id = job_view_days.job_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- UPDATE policies need WITH CHECK so a provider cannot reassign a row.
drop policy if exists applications_update_by_provider on applications;
create policy applications_update_by_provider on applications
  for update to authenticated
  using (
    exists (
      select 1 from jobs j
      join providers p on p.id = j.provider_id
      where j.id = applications.job_id and p.owner_user_id = (select auth.uid())
    )
    and (access_expires_at is null or now() < access_expires_at)
  )
  with check (
    exists (
      select 1 from jobs j
      join providers p on p.id = j.provider_id
      where j.id = applications.job_id and p.owner_user_id = (select auth.uid())
    )
    and (access_expires_at is null or now() < access_expires_at)
  );
