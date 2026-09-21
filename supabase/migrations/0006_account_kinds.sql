-- Account kind is sticky. Applicants and providers are separate accounts.
-- Authorization still uses profiles / providers rows; this table is the
-- sign-in intent so a job-seeker cannot later open a business dashboard
-- on the same login (and the reverse).

create type account_kind as enum ('applicant', 'provider');

create table account_kinds (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kind account_kind not null,
  created_at timestamptz not null default now()
);

alter table account_kinds enable row level security;

create policy account_kinds_own_read on account_kinds
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy account_kinds_own_insert on account_kinds
  for insert to authenticated
  with check (user_id = (select auth.uid()));

grant select, insert on table account_kinds to authenticated;
