-- Applicant requirement evidence. Status is pending until an admin verifies.
-- Providers may read checks only after that applicant applied to their job.

create type requirement_check_status as enum ('pending', 'verified', 'rejected');

create table requirement_checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  requirement requirement not null,
  status requirement_check_status not null default 'pending',
  evidence_path text,
  applicant_note text,
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  primary key (user_id, requirement)
);

create index requirement_checks_pending_idx
  on requirement_checks (submitted_at)
  where status = 'pending';

alter table requirement_checks enable row level security;

create policy requirement_checks_own_read on requirement_checks
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy requirement_checks_own_insert on requirement_checks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
  );

create policy requirement_checks_own_update on requirement_checks
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('pending', 'rejected')
  )
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
  );

create policy requirement_checks_read_by_applied_provider on requirement_checks
  for select to authenticated
  using (
    exists (
      select 1
      from applications a
      join jobs j on j.id = a.job_id
      join providers p on p.id = j.provider_id
      where a.applicant_user_id = requirement_checks.user_id
        and p.owner_user_id = (select auth.uid())
        and (a.access_expires_at is null or now() < a.access_expires_at)
    )
  );

grant select, insert, update on table requirement_checks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'requirement-evidence', 'requirement-evidence', false, 5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

create policy requirement_evidence_own_all on storage.objects
  for all to authenticated
  using (
    bucket_id = 'requirement-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'requirement-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
