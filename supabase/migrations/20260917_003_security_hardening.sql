create schema if not exists private;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select role from public.profiles where id = auth.uid() $$;

revoke all on function private.current_role() from public, anon;
grant execute on function private.current_role() to authenticated;

-- Replace policies to use a non-exposed helper schema.
drop policy if exists "read own or managed profiles" on public.profiles;
create policy "read own or managed profiles" on public.profiles for select to authenticated
using (id = auth.uid() or private.current_role() in ('admin','manager'));

drop policy if exists "management write teams" on public.teams;
create policy "management write teams" on public.teams for all to authenticated
using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));

drop policy if exists "management write operators" on public.operators;
create policy "management write operators" on public.operators for all to authenticated
using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));

drop policy if exists "management write campaigns" on public.campaigns;
create policy "management write campaigns" on public.campaigns for all to authenticated
using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));

drop policy if exists "management write sales" on public.sales;
create policy "management write sales" on public.sales for all to authenticated
using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));

drop policy if exists "admin write loadouts" on public.loadouts;
create policy "admin write loadouts" on public.loadouts for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

drop policy if exists "management read audit" on public.audit_logs;
create policy "management read audit" on public.audit_logs for select to authenticated
using (private.current_role() in ('admin','manager'));

create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() = old.id and private.current_role() <> 'admin' then
    new.role := old.role;
    new.active := old.active;
    new.team_id := old.team_id;
    new.operator_id := old.operator_id;
  end if;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_profile_sensitive_fields() from public, anon, authenticated;
drop function if exists public.current_role();
