-- Privileges PostgREST's service_role needs after the app migrations.

grant usage on schema public to service_role, authenticator;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

grant usage on schema auth to service_role, authenticator, anon, authenticated;
grant select, insert, update, delete on all tables in schema auth to service_role, authenticator;

grant usage on schema storage to service_role;
grant all on all tables in schema storage to service_role;
