-- Applicants save live jobs. Cascade when the user or job is removed.

create table saved_jobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index saved_jobs_user_created_idx on saved_jobs (user_id, created_at desc);

alter table saved_jobs enable row level security;

create policy saved_jobs_own_select on saved_jobs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy saved_jobs_own_insert on saved_jobs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy saved_jobs_own_delete on saved_jobs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on table saved_jobs to authenticated;
